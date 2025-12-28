Admin side (updated)

Bulk upload: upload a ZIP (recommended) or multiple PDFs in one go

System extracts/reads each file, figures out which user it belongs to, then saves it and creates DB records

Single upload remains for one-off fixes

User side (same)

Login

See only their own statements

View/download PDFs

2) Bulk upload: how to match each PDF to the right user

You have 3 practical options (pick one; #1 is simplest and most common):

Option 1: Filename mapping (simplest)

Define a strict naming rule, like:

UNIT-1203_2025-12.pdf

ACC-000123_2025-12.pdf

mtrampe_2025-12.pdf

Bulk upload works by parsing the filename:

extract unit/account identifier

extract billing month

look up the user by that identifier

store the PDF linked to that user

✅ Fast and easy for admins
⚠️ Requires strict naming discipline


3) Database design (same core, with bulk import tracking)

billing_statements

id

user_id

billing_month (or start/end)

original_filename

stored_filename / storage_key

uploaded_by (admin id)

created_at

Add an optional table for audit/debugging bulk imports:

bulk_upload_jobs

id

uploaded_by

total_files

success_count

failed_count

created_at

bulk_upload_job_items

id

job_id

original_filename

status (success / failed)

error_message (e.g., “No user found for UNIT-1203”)

statement_id (nullable, link to billing_statements)

This is super useful so the admin can see what failed and why.

4) Backend endpoints (with bulk support)
Auth

POST /auth/login

Admin uploads

POST /admin/billing/upload-single (PDF + userId + billingMonth)

POST /admin/billing/upload-bulk

Accept either:

multipart/form-data with files[] (multiple PDFs), or

zipFile (one ZIP)

optional mappingCsv

User access

GET /billing → returns statements only for logged-in user

GET /billing/:id/pdf → streams PDF only if owned (or admin)

5) Bulk upload processing flow (step-by-step)

When admin submits a bulk upload:

Create a bulk job record

bulk_upload_jobs row with total_files = N

Expand input

If ZIP: unzip to temp folder

If multi-PDF: process each directly

For each PDF

Validate:

mime type is PDF

file size within limit

Determine owner + billing month:

from filename (Option 1) or CSV mapping (Option 2)

Lookup user:

SELECT id FROM users WHERE unit_no = ? (or account number)

Store file:

local disk: /uploads/billing/<uuid>.pdf

or S3: billing/<userId>/<uuid>.pdf

Insert billing_statements record

Mark job item as success

If any file fails

Save the error to bulk_upload_job_items (don’t crash the whole job)

Continue processing the rest

Return a summary

total, succeeded, failed

list of failed filenames + reasons

6) Frontend flow (admin + user)
Admin UI

Bulk Upload page

Upload method:

“Upload ZIP” (recommended)

or “Upload multiple PDFs”

Mapping mode:

“Filename mapping” (shows required filename format)

or “CSV mapping” (upload CSV)

After upload: show results:

✅ imported

❌ failed + reason

Single Upload page

choose user

choose billing month

pick one PDF

User UI

Billing statements list (month/date)

View/Download

7) Security rules (even more important with bulk)

Never expose /uploads as a public folder

Always stream PDFs through a protected route that checks:

statement.user_id === req.user.id

Admin routes require role === 'admin'

Validate size/type for every uploaded file

Use unique storage names (UUID) so filenames can’t be guessed

8) Recommended “simple” implementation choices

Bulk upload input: ZIP upload as primary (cleaner than thousands of multipart files)

Mapping: Filename mapping first; add CSV mapping later if needed

Storage: local disk for MVP; S3 when you deploy to multiple servers or want scalability