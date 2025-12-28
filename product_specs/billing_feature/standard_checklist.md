CTO Engineering Standards Checklist (Billing Statements in Member Portal)
1) Access control and security

 All billing endpoints require authentication.

 Member can only access their own statements (ownership check on every request).

 Member can only access statements within last 3 months (enforced on list + PDF endpoints).

 Admin-only endpoints are protected by requireAdmin.

 PDFs are never served from a public/static folder.

 Passwords are hashed (bcrypt/argon2), login is rate-limited, and auth tokens handled safely (prefer httpOnly cookies).

2) File upload safety

 Accept PDF only (validate mimetype + magic bytes).

 Enforce max file size and max bulk limits (files count, zip size, extracted size).

 Store PDFs with UUID filenames (never trust original filename).

 ZIP extraction is protected against zip-slip/path traversal.

 Uploads and downloads are streamed (no “read whole file into memory”).

 Optional: malware scan PDFs (recommended if uploads come from outside).

3) Bulk upload correctness and UX

 Bulk upload is the primary UI (ZIP or multi-PDF).

 Mapping strategy is defined and documented:

 Filename convention or

 CSV mapping

 Per-file processing continues even if some files fail.

 Admin sees a clear job summary: total, imported, failed + reasons.

 Duplicate policy is defined:

 Unique constraint (user_id, billing_month)

 Replace vs reject behavior is implemented consistently (recommended: replace with audit)

4) Data model and queries

 billing_month is normalized (store as first day of month, e.g., YYYY-MM-01).

 Index exists on (user_id, billing_month).

 Audit fields exist: uploaded_by, created_at, optional bulk_job_id.

 Bulk job tables exist (recommended): bulk_upload_jobs, bulk_upload_job_items.

5) Observability and ops

 Structured logs for upload jobs and access events (no sensitive PII).

 Error responses are consistent (code, message, details).

 DB backups are configured; file storage is persistent (prefer object storage in production).

 Separate dev/staging/prod configs and secrets management.

6) Testing requirements

 Unit tests for:

 3-month threshold calculation

 filename/CSV parsing

 Integration tests for:

 member cannot access another user’s PDF

 member cannot access older-than-3-month statement even by ID

 bulk upload partial failure behavior + job summary

 Basic load test for bulk upload limits and timeouts.

Definition of Done (Billing Module)
Backend (must be complete)

 POST /auth/login + auth middleware in place.

 GET /api/billing returns only the logged-in member’s statements within last 3 months.

 GET /api/billing/:id/pdf streams PDF only if:

 user owns it (or admin)

 within last 3 months (if member)

 POST /api/admin/billing/upload-bulk supports ZIP or multi-PDF and returns:

 total/success/failed counts

 failure details per file

 POST /api/admin/billing/upload-single works for one-off uploads.

 Duplicate handling (replace/reject) matches spec and is tested.

 DB migrations are created for tables + indexes + constraints.

Frontend (must be complete)

 Member Billing page:

 shows “last 3 months only” notice

 lists statements and allows view/download

 correct empty state

 Admin Bulk Upload page:

 ZIP/multi-PDF upload

 mapping method selection (filename or CSV if supported)

 results summary + failed file list

 Admin Single Upload page for manual fixes.

 Role-based navigation (UX only; backend still enforces).

Non-functional (must be complete)

 Security review checklist passed (no public file serving, ownership checks, validation).

 Logs exist for bulk jobs and failures.

 Deployment notes included (storage persistence, env vars, limits).

 Test suite passing in CI.

Policy decisions (locked in unless you tell me otherwise)

Member visibility window: rolling last 3 months (business timezone: Asia/Manila)

Bulk mapping default: filename convention

Duplicate behavior: replace existing for same (user_id, billing_month) (recommended)