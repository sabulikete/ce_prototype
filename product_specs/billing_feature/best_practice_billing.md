Security and access control

Enforce authorization on the backend, not the UI. Every billing list/view request must check:

user is authenticated

statement belongs to that user

statement is within the last 3 months (member-only rule)

Never serve the upload folder publicly. Don’t expose /uploads via nginx/static hosting. PDFs must be returned only via a protected API (streaming) or short-lived signed URLs.

Use least privilege. Separate middleware like requireAuth, requireAdmin.

Strong password handling. bcrypt (or argon2) hashes, proper password policy, rate limit login, lockout/backoff for repeated failures.

JWT storage carefully. Prefer httpOnly cookies (safer vs XSS). If you use localStorage, be extra strict with XSS prevention.

File handling and upload safety

Validate file type and size. Check both mimetype and “magic bytes” (don’t trust filename). Reject non-PDFs.

Generate server-side filenames (UUID). Never trust original filename for storage.

Virus/malware scanning (recommended). If feasible, scan uploaded PDFs (e.g., ClamAV) especially if admins upload externally sourced files.

Don’t load whole PDFs into memory. Stream files (upload and download) to avoid crashes on large files.

Temporary ZIP extraction safety.

prevent zip-slip path traversal

enforce max extracted size / max file count

reject nested zips if you don’t need them

Data model best practices

Store a normalized billing_month. Save as the first day of month (e.g., 2025-12-01) for consistent queries.

Prevent duplicates. Unique constraint (user_id, billing_month).

Define replacement behavior. For re-uploads, use an explicit “replace existing” flow (recommended default: replace).

Auditability. Track:

who uploaded (uploaded_by)

when

bulk job id + per-file success/failure reasons

Bulk upload reliability

Design a deterministic mapping rule. Bulk upload only works if you can map each file to a user:

filename mapping (strict convention) and/or

CSV mapping

Fail per file, not the whole batch. Continue processing remaining PDFs; return a clear report of failures.

Idempotency. Same input should produce the same result (especially when replacing), so retries don’t create duplicates.

Post-upload summary. Admin must see imported count + failed list with actionable messages.

3-month visibility rule (correctness)

Compute the 3-month window consistently in one place. Central function like getBillingVisibilityThreshold(now, tz) used by:

list endpoint

view/download endpoint

Use business timezone (Asia/Manila). Avoid “month boundary” bugs.

Don’t rely on UI filtering. Backend is the source of truth.

API and backend engineering

Typed validation. Validate request bodies with a schema (e.g., Zod / Joi) so you don’t accept bad input.

Standard error responses. Return structured errors (code, message, details) so the frontend can show clear UI.

Pagination for lists. Even if it’s only 3 months, do it right and consistent.

Central logging + correlation IDs. Especially for bulk jobs—debugging without logs is pain.

Database indexes.

billing_statements(user_id, billing_month)

billing_statements(billing_month) if admins filter by month often

Frontend best practices

Role-based routing is UX only. Still enforce roles on API.

Clear UX around “last 3 months.”

show banner/tooltip “Showing last 3 months only”

friendly empty states

Safe PDF viewing.

prefer opening via protected endpoint in a new tab or iframe

don’t leak direct file paths

Storage and deployment

Prefer object storage for production. Local disk is okay for MVP, but S3-compatible storage prevents “lost files” during deployments/scaling.

Backups and retention.

DB daily backups

file storage lifecycle policy (if needed)

Secrets management. Never commit secrets; use env vars + secret store.

Environment separation. Dev/staging/prod with separate DB and storage buckets/paths.

Testing and QA (must-have)

Unit tests for:

month threshold logic

filename parsing (bulk mapping)

Integration tests for:

member cannot access others’ PDFs

member cannot access older-than-3-month statements (even by ID)

admin bulk upload error handling

Load/limit tests for bulk upload:

many PDFs

big zip

timeout behavior

Compliance and privacy

Data minimization in logs. Don’t log PII or full filenames if they contain PII.

Access logging. Track statement access (optional, but useful in disputes).

Retention policy clarity. If you store older statements but hide them, document why and who can access them.