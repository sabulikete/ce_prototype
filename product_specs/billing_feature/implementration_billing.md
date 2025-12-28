Implementation Specs: Billing Statements Module (Member Portal)
1) Scope and Goals
Purpose

Enable admins to upload billing statement PDFs (bulk primary, single optional) and allow members to view only their own statements for the past 3 billing months.

In-scope

Admin bulk upload (ZIP primary) with deterministic filename mapping

Admin single upload (fallback)

Member listing + viewing/downloading statements (3-month rolling window)

Secure file storage (hybrid: local MVP + object storage ready)

Duplicate handling (replace)

Bulk upload jobs with per-file success/failure reporting

Production-safe limits, rate limiting, logging, testing

Out-of-scope (for now)

Extracting metadata from inside PDF (OCR/text parsing)

Viewing beyond 3 months for members

Member self-upload

2) Roles and Access Rules
Roles

Admin

Can upload bulk/single

Can view any statement for support (recommended)

Member

Can list/view/download only their own statements

Restricted to rolling past 3 billing months (based on billing_month, not upload date)

Security principles

Backend enforces all access control

PDFs are never publicly accessible via static hosting

3) Filename Convention and Parsing (Source of Truth)
Required filename format (case-sensitive month)

Format: MMM-YYYY B C-U.pdf

Example: DEC-2025 3C-201.pdf

Where:

MMM ∈ JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC

YYYY = 4-digit year

B (building) ∈ 1,2,3,4

C (cluster) ∈ A,B,C,D,E,F

U (unit) = numeric unit string (default: 3 digits like 201)

Space required between date and building/cluster-unit: DEC-2025␠3C-201.pdf

Parsing regex
^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-(\d{4})\s([1-4])([A-F])-(\d{3})\.pdf$

Derived fields

From DEC-2025 3C-201.pdf:

billing_month = 2025-12-01 (first day of month)

building = 3

cluster = C

unit = 201

unit_key = 3C-201 (or store as building+cluster+unit)

Mapping to member

System must map (building, cluster, unit) to a user/account record.

Recommended: store building, cluster, unit fields on a member profile or an accounts/units table.

Bulk upload fails a file if no matching member/account exists.

4) Billing Month and 3-Month Window
Billing month definition

Billing month is derived from filename MMM-YYYY

Store as DATE in DB: first day of month (YYYY-MM-01)

Member visibility window

Rolling last 3 months including current month, based on Asia/Manila timezone.

Define:

threshold_month = first_day_of_month(now_manila - 2 months)

Member can only access statements where:

billing_month >= threshold_month

Example: If now is Dec 2025 → threshold is Oct 1, 2025 → show Oct/Nov/Dec.

5) Storage Architecture (Hybrid)
StorageProvider abstraction

Implement a provider interface so switching from local → object storage is easy:

save(stream|buffer, key, contentType) -> { key, size, checksum }

getStream(key) -> readableStream

delete(key) -> void

exists(key) -> bool (optional)

Providers

LocalDiskProvider (MVP)

Store under a mounted persistent directory, e.g. /data/billing/

Key format example: billing/2025-12/3C-201/<uuid>.pdf mapped to a filesystem path

ObjectStorageProvider (near-term production)

S3-compatible (AWS S3 / R2 / Spaces / MinIO)

Same key format as above

Serving PDFs

Two acceptable approaches:

Backend streaming (recommended for consistent auth):

API checks auth + ownership + 3-month rule, then streams bytes

Signed URLs (optional later):

API checks auth + rules, returns time-limited URL

For now, implement backend streaming.

6) Limits and Bulk Upload Strategy
Per-file limit

Max PDF size: 10 MB

Validate MIME + magic bytes

Bulk job limits (production-safe)

We allow up to 500 PDFs per job, but do not allow 5GB single ZIP uploads.

Max PDFs per job: 500

Max ZIP size per request: 500 MB

Max extracted size per request: 1.2 GB

Rule: max_extracted = min(2.5 × zip_size, 1.2 GB)

Max total extracted size per job: 5 GB (logical upper bound)

Processing model

Async job processing is required to support large batches reliably.

Upload request should:

Validate ZIP size

Store ZIP (via StorageProvider or local temp)

Create job + enqueue worker

Return job id immediately

Processing time targets

Job max runtime: 45 minutes for full 500 PDFs worst-case

Per-file processing timeout: 15 seconds (tunable)

Worker concurrency: 3 files at a time (tunable)

7) Duplicate Policy (Replace)

Uniqueness is defined by (account/user, billing_month).

When importing a statement that already exists for that user + month:

Replace behavior:

delete old stored file (best effort)

update existing DB row with new storage_key, checksum, updated_at

record replacement in audit/job items

8) Database Schema (MySQL)
users

id (PK)

email (unique)

password_hash

role ENUM(admin,member)

created_at, updated_at

member_units (recommended if mapping by unit)

id (PK)

user_id (FK users.id, unique if one unit per user)

building TINYINT (1–4)

cluster CHAR(1) (A–F)

unit VARCHAR(10) (default “201”)

unique key: (building,cluster,unit)

If members can have multiple units, remove unique on user_id and allow multiple rows.

billing_statements

id (PK)

user_id (FK users.id)

billing_month DATE (YYYY-MM-01)

original_filename VARCHAR(255)

storage_key VARCHAR(512)

content_type VARCHAR(64) default application/pdf

size_bytes INT

checksum_sha256 CHAR(64) (optional but recommended)

uploaded_by (FK users.id)

created_at, updated_at

Unique key: (user_id, billing_month)

Index: (user_id, billing_month)

bulk_upload_jobs

id (PK)

uploaded_by (FK users.id)

status ENUM(queued,processing,completed,completed_with_errors,failed,cancelled)

total_files INT

success_count INT

failed_count INT

zip_storage_key VARCHAR(512) (where zip is stored)

created_at, updated_at

bulk_upload_job_items

id (PK)

job_id (FK bulk_upload_jobs.id)

original_filename VARCHAR(255)

parsed_billing_month DATE NULL

parsed_building TINYINT NULL

parsed_cluster CHAR(1) NULL

parsed_unit VARCHAR(10) NULL

mapped_user_id BIGINT NULL

status ENUM(success,failed,replaced)

statement_id BIGINT NULL (FK billing_statements.id)

error_code VARCHAR(64) NULL

error_message VARCHAR(255) NULL

created_at, updated_at

9) API Design (Express + TypeScript)
Auth

POST /api/auth/login

body: { email, password }

returns: token/cookie + user role

GET /api/auth/me (optional)

Admin: Bulk upload (ZIP primary)

POST /api/admin/billing/bulk-jobs

Auth: admin

Input: multipart form-data: zipFile

Validations:

zip size <= 500MB

content type zip

Behavior:

store zip via StorageProvider

create bulk_upload_jobs with status=queued

enqueue job

Returns:

{ jobId }

GET /api/admin/billing/bulk-jobs/:jobId

Auth: admin

Returns job status + counts + summary

GET /api/admin/billing/bulk-jobs/:jobId/items?status=failed

Auth: admin

Returns paginated list of items with reasons

Admin: Single upload (fallback)

POST /api/admin/billing/upload-single

Auth: admin

Input: PDF + userId + billingMonth (or filename parsing allowed)

Enforce PDF <= 10MB

Apply replace policy

Member: List statements (3-month enforced)

GET /api/billing

Auth: member/admin

Member behavior:

filter by user_id = req.user.id

filter by billing_month >= threshold_month

Admin behavior (optional):

can pass userId query param to view member statements (support use)

Returns list: { id, billingMonth, createdAt, sizeBytes }

Member: Stream PDF (3-month + ownership enforced)

GET /api/billing/:id/pdf

Auth: member/admin

Member checks:

statement.user_id == req.user.id

statement.billing_month >= threshold_month

Streams bytes with Content-Type: application/pdf

10) Bulk Worker Logic (Async)

Input: jobId, zip_storage_key

Steps:

Mark job processing

Download ZIP to temp worker disk (or stream)

Safely extract with limits:

prevent zip-slip

count files, total extracted size <= 1.2GB

For each PDF:

validate PDF magic bytes + size <= 10MB

parse filename with regex

map (building,cluster,unit) → user_id

compute billing_month

save PDF via StorageProvider

upsert billing_statement by (user_id, billing_month):

if exists → replace file + update row → mark item replaced

else insert → mark item success

on error → item failed with error_code/message

Update job counts + final status:

if failed_count > 0 → completed_with_errors

else completed

Cleanup temp files; optionally delete uploaded ZIP after retention period

11) Validation Rules and Error Codes
Error codes (examples)

INVALID_FILENAME_FORMAT

INVALID_MONTH_TOKEN

INVALID_BUILDING

INVALID_CLUSTER

INVALID_UNIT

NO_MATCHING_MEMBER_UNIT

NOT_A_PDF

PDF_TOO_LARGE

ZIP_TOO_LARGE

EXTRACTED_TOO_LARGE

TOO_MANY_FILES

STORAGE_WRITE_FAILED

DB_WRITE_FAILED

ACCESS_DENIED

STATEMENT_OUT_OF_WINDOW

Response format

Return:

code

message

details (optional)

12) Rate Limiting Policy (Bulk-focused)

Enforce per admin + per IP, plus active-job caps:

Bulk job creation:

3 jobs / 15 min / admin

Batch uploads (if added later):

10 batches / 15 min / admin

Active job caps:

2 active bulk jobs / admin

10 active bulk jobs system-wide

Single upload:

30 / 15 min / admin

Login:

standard rate limiting + backoff/lockout policy

13) Frontend (Member Portal) Requirements
Member pages

Billing Statements Page

Shows banner: “Showing last 3 months only”

Table: Billing Month, Uploaded Date, Actions (View/Download)

Empty state message if none

View action

Opens /api/billing/:id/pdf in new tab or embedded iframe viewer

Admin pages

Bulk Upload Page (primary)

Upload ZIP file

Shows filename format instructions + example

On submit: creates job, shows job progress/status

Results view:

totals

failed items with reasons (downloadable CSV optional)

Single Upload Page (fallback)

Select user/account

Select billing month

Upload PDF

14) Logging, Audit, and Monitoring

Log bulk job lifecycle: created → processing → completed

Log per-file failures with jobId + error_code (avoid sensitive PII)

Track statement access logs (optional but recommended)

Add metrics:

job duration

success/fail counts

storage latency

15) Testing Requirements
Unit tests

Filename parser + regex cases (valid/invalid)

Billing month conversion MMM-YYYY → YYYY-MM-01

3-month threshold function (Asia/Manila boundary cases)

Replace duplicate policy behavior (DB upsert rules)

Integration tests

Member cannot access another user’s statement

Member cannot access statement older than threshold (even with direct ID)

Admin bulk job handles partial failures

Replace behavior updates statement and removes old file (best effort)

Load tests (basic)

ZIP near 500MB

100–200 PDFs batch processing time

Worker concurrency stability

16) Deployment Notes

MVP local storage must use persistent mounted volume (not inside app directory)

Production-ready path uses object storage (S3-compatible)

Async job queue: Redis + BullMQ (recommended)

Configure gateway limits:

max request body size >= 500MB for ZIP uploads

timeouts suitable for upload, not processing (processing async)

17) Open Items (Optional Enhancements)

CSV export of failed items

Signed URLs for PDF view (performance)

Virus scanning (ClamAV) for uploads

Multi-unit members support (if needed)

Admin UI “replace existing” toggle (default replace)






Goal

Add a Billing Statements feature inside the Member Portal where:

Admins upload billing PDFs (bulk primary via ZIP; single optional)

Members can view/download only their own statements

Members can access only the last 3 billing months (rolling window, based on billing_month, Asia/Manila)

Filename Mapping (Source of Truth)

Required format: MMM-YYYY B C-U.pdf
Example: DEC-2025 3C-201.pdf

MMM: JAN..DEC (uppercase)

YYYY: 4 digits

B: building 1..4

C: cluster A..F

U: unit (default 3 digits, e.g. 201)

One space between date and unit key

Regex:

^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-(\d{4})\s([1-4])([A-F])-(\d{3})\.pdf$


Derived:

billing_month = YYYY-MM-01

Map (building, cluster, unit) → member account/user record

Visibility Rule (Members)

Compute monthly threshold (Asia/Manila):

threshold_month = first_day_of_month(now - 2 months)

Members can list/view only statements with:

user_id = req.user.id

billing_month >= threshold_month

Duplicate Policy (Replace)

Uniqueness: (user_id, billing_month)
On import if duplicate exists:

replace stored PDF (delete old best-effort)

update DB row (storage_key, checksum, size, updated_at)

mark job item as replaced

Storage (Hybrid)

Implement StorageProvider abstraction:

Local disk provider (MVP) on persistent mounted volume (not public)

S3-compatible object storage provider (near-term production)
Serve PDFs via secured API streaming (no public file folder)

Bulk Upload & Processing

Primary: ZIP upload creates a bulk job and returns jobId immediately

Async worker processes job:

safe unzip (zip-slip protected)

validate PDFs (magic bytes + size ≤ 10MB)

parse filename, map to member, save PDF, upsert statement, log per-file result

Limits (Production-safe soon)

PDF max: 10MB

Max PDFs per job: 500

Max ZIP per request: 500MB

Max extracted per request: min(2.5×zip_size, 1.2GB)

Job runtime cap: 45 minutes

Worker concurrency: 3 files at a time (tunable)

Rate Limits (Bulk-focused)

Create bulk jobs: 3 / 15 min / admin

Single upload: 30 / 15 min / admin

Active bulk jobs: 2 per admin, 10 system-wide

Done when

Admin bulk upload works with job tracking + per-file failures

Member list + PDF streaming enforces ownership + 3-month rule

Duplicate replace works

DB migrations + basic tests (parser, 3-month threshold, auth checks) passing




Auth assumptions

Requests require authentication via JWT (cookie or Authorization header).

req.user = { id, role } after auth middleware.

Standard error format:

{ "code": "SOME_CODE", "message": "Human readable message", "details": { } }

2.1 Auth
POST /api/auth/login

Body

{ "email": "user@example.com", "password": "secret" }


200

{
  "user": { "id": 123, "email": "user@example.com", "role": "member" },
  "token": "JWT_IF_USING_HEADER_MODE"
}


401

{ "code": "INVALID_CREDENTIALS", "message": "Email or password is incorrect." }

2.2 Member endpoints
GET /api/billing

Returns the logged-in member’s statements for last 3 billing months.

Auth: member/admin
Member behavior: restrict to own + 3-month rule
Admin behavior (optional): if userId query is provided, show that user’s statements (support use)

Query (optional for admin)

userId=123

200

{
  "items": [
    {
      "id": 9001,
      "billingMonth": "2025-12-01",
      "sizeBytes": 348211,
      "createdAt": "2025-12-05T10:12:13.000Z",
      "updatedAt": "2025-12-05T10:12:13.000Z"
    }
  ]
}


403

{ "code": "ACCESS_DENIED", "message": "You do not have access to this resource." }

GET /api/billing/:id/pdf

Streams PDF for a statement.

Auth: member/admin
Member checks

statement.user_id == req.user.id

statement.billing_month >= threshold_month

200

Content-Type: application/pdf

Streams bytes

403 (ownership or out-of-window)

{ "code": "STATEMENT_OUT_OF_WINDOW", "message": "This statement is not available." }


404

{ "code": "NOT_FOUND", "message": "Statement not found." }

2.3 Admin endpoints
POST /api/admin/billing/bulk-jobs

Creates a bulk job from a ZIP file and enqueues async processing.

Auth: admin
Content-Type: multipart/form-data

zipFile: ZIP file

Validations

zip size ≤ 500MB

zip content type/extension sanity check (still validate by attempting unzip in worker)

201

{
  "jobId": 7001,
  "status": "queued"
}


429

{ "code": "RATE_LIMITED", "message": "Too many bulk uploads. Try again later." }


413

{ "code": "ZIP_TOO_LARGE", "message": "ZIP exceeds maximum size." }

GET /api/admin/billing/bulk-jobs/:jobId

Gets job summary and status.

Auth: admin

200

{
  "job": {
    "id": 7001,
    "status": "completed_with_errors",
    "totalFiles": 120,
    "successCount": 110,
    "failedCount": 10,
    "createdAt": "2025-12-29T03:10:00.000Z",
    "updatedAt": "2025-12-29T03:14:12.000Z"
  }
}


404

{ "code": "NOT_FOUND", "message": "Job not found." }

GET /api/admin/billing/bulk-jobs/:jobId/items

Gets job items (optionally filtered).

Auth: admin
Query

status=failed|success|replaced

page=1

pageSize=50

200

{
  "page": 1,
  "pageSize": 50,
  "total": 10,
  "items": [
    {
      "id": 88001,
      "originalFilename": "DEC-2025 3C-201.pdf",
      "status": "failed",
      "errorCode": "NO_MATCHING_MEMBER_UNIT",
      "errorMessage": "No member found for building=3 cluster=C unit=201",
      "mappedUserId": null,
      "parsedBillingMonth": "2025-12-01"
    }
  ]
}

POST /api/admin/billing/upload-single

Uploads a single PDF and assigns it to a user + billing month (manual fix path).

Auth: admin
Content-Type: multipart/form-data

pdfFile: PDF

userId: number

billingMonth: string (YYYY-MM-01)

201

{
  "statement": {
    "id": 9002,
    "userId": 123,
    "billingMonth": "2025-12-01",
    "createdAt": "2025-12-29T03:20:00.000Z",
    "updatedAt": "2025-12-29T03:20:00.000Z"
  },
  "result": "created"
}


200 (if replaced existing)

{
  "statement": {
    "id": 9001,
    "userId": 123,
    "billingMonth": "2025-12-01",
    "createdAt": "2025-12-05T10:12:13.000Z",
    "updatedAt": "2025-12-29T03:20:00.000Z"
  },
  "result": "replaced"
}


400

{ "code": "INVALID_INPUT", "message": "billingMonth must be YYYY-MM-01." }


413

{ "code": "PDF_TOO_LARGE", "message": "PDF exceeds 10MB." }

3) Exact MySQL DDL Migrations (InnoDB, utf8mb4)

Notes:

Adjust users table fields if you already have one in your portal. If so, only add the billing-specific tables + unit mapping table or columns.

Uses BIGINT IDs, UTC timestamps, and enforces constraints.

-- 001_create_users.sql
-- If you already have users, skip this migration and map to your existing users table.
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','member') NOT NULL DEFAULT 'member',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 002_create_member_units.sql
-- Maps a user to a unit key (building+cluster+unit). If members can have multiple units, remove UNIQUE on user_id.
CREATE TABLE IF NOT EXISTS member_units (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  building TINYINT UNSIGNED NOT NULL,
  cluster CHAR(1) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_member_units_user (user_id),
  UNIQUE KEY uq_member_units_unitkey (building, cluster, unit),
  CONSTRAINT fk_member_units_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_member_units_building CHECK (building BETWEEN 1 AND 4),
  CONSTRAINT chk_member_units_cluster CHECK (cluster IN ('A','B','C','D','E','F'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 003_create_billing_statements.sql
CREATE TABLE IF NOT EXISTS billing_statements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  billing_month DATE NOT NULL, -- store as YYYY-MM-01
  original_filename VARCHAR(255) NOT NULL,
  storage_key VARCHAR(512) NOT NULL,
  content_type VARCHAR(64) NOT NULL DEFAULT 'application/pdf',
  size_bytes INT UNSIGNED NOT NULL,
  checksum_sha256 CHAR(64) NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_billing_user_month (user_id, billing_month),
  KEY ix_billing_user_month (user_id, billing_month),
  KEY ix_billing_month (billing_month),
  CONSTRAINT fk_billing_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_billing_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 004_create_bulk_upload_jobs.sql
CREATE TABLE IF NOT EXISTS bulk_upload_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  status ENUM('queued','processing','completed','completed_with_errors','failed','cancelled') NOT NULL DEFAULT 'queued',
  total_files INT UNSIGNED NOT NULL DEFAULT 0,
  success_count INT UNSIGNED NOT NULL DEFAULT 0,
  failed_count INT UNSIGNED NOT NULL DEFAULT 0,
  zip_storage_key VARCHAR(512) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_bulk_jobs_status_created (status, created_at),
  CONSTRAINT fk_bulk_jobs_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 005_create_bulk_upload_job_items.sql
CREATE TABLE IF NOT EXISTS bulk_upload_job_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_id BIGINT UNSIGNED NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  parsed_billing_month DATE NULL,
  parsed_building TINYINT UNSIGNED NULL,
  parsed_cluster CHAR(1) NULL,
  parsed_unit VARCHAR(10) NULL,
  mapped_user_id BIGINT UNSIGNED NULL,
  status ENUM('success','failed','replaced') NOT NULL,
  statement_id BIGINT UNSIGNED NULL,
  error_code VARCHAR(64) NULL,
  error_message VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_job_items_job_status (job_id, status),
  KEY ix_job_items_mapped_user (mapped_user_id),
  CONSTRAINT fk_job_items_job
    FOREIGN KEY (job_id) REFERENCES bulk_upload_jobs(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_job_items_mapped_user
    FOREIGN KEY (mapped_user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_job_items_statement
    FOREIGN KEY (statement_id) REFERENCES billing_statements(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

Quick note (so devs don’t stumble)

MySQL CHECK constraints are enforced in MySQL 8.0+; if you might run older versions, enforce building/cluster constraints in app logic too.