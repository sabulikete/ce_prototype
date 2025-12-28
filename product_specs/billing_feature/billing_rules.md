Product rules (source of truth)

Access

Member: can list/view/download only their own statements.

Admin: can upload (bulk/single), and can view any statement for support.

3-month window

A member can only see statements where billing_month is within the last 3 billing months, including the current month.

Example (today is Dec 2025): show Oct, Nov, Dec 2025 only.

Admin is not restricted by this window (optional, but recommended for support).

Data retention

You may still store older PDFs for compliance/audit, but don’t expose them to members.

Database (small update)

In billing_statements, ensure you have a normalized month key:

billing_month (DATE) → store as the first day of the month (e.g., 2025-12-01)

This makes filtering easy and consistent.

Other fields remain the same:

user_id, storage_key, original_filename, created_at, etc.

Backend API behavior (enforce the 3-month rule server-side)
1) List statements (member)

GET /api/billing

Auth required

Returns only:

user_id = req.user.id

billing_month >= first_day_of_month(today - 2 months) (3 months total window)

Sorted newest → oldest

Example logic (conceptual):

If now = Dec 29, 2025

threshold = Oct 1, 2025

return Oct/Nov/Dec

2) View/download a PDF (member)

GET /api/billing/:id/pdf

Auth required

Backend fetches the statement row by id

Enforce:

statement belongs to the user

statement month is within last 3 months

Then stream the PDF

This prevents “guessing IDs” or bypassing the UI.

3) Upload endpoints (admin)

POST /api/admin/billing/upload-bulk (ZIP/multi-PDF)

POST /api/admin/billing/upload-single

Uploads can include older months too; members still won’t see them.

Bulk upload changes (to support the 3-month rule cleanly)

When importing each PDF, you must reliably assign:

owner (user/unit/account)

billing_month

For filename mapping, I’d standardize this:

UNIT-1203_2025-12.pdf → billing_month = 2025-12-01

If a file doesn’t include a valid month, it fails the job item with a clear error.

Also: prevent duplicates:

Add a unique constraint: (user_id, billing_month)

If you re-upload the same month, choose behavior:

replace existing (delete old file + update row), or

reject duplicate
I recommend replace (less admin friction).

Frontend UX (member portal)
Member Billing page

Shows a banner: “Showing last 3 months”

List view: Month, Uploaded date, View/Download

If none: “No statements available for the last 3 months.”

Admin Upload page

Bulk upload as primary

After upload, show:

imported count

failed items with reasons (no user match, invalid month, not a PDF, duplicate rules, etc.)

Optional: a “replace existing” toggle if you want control.

Edge cases I’d define now

Timezone: compute “current month” using your business timezone (Asia/Manila).

Month boundaries: On Jan 1, visible months become Nov/Dec/Jan.

Late posting: If December’s statement is uploaded in January, it still appears because it’s within the last 3 months.

Account mapping: If a user changes units/accounts, decide whether old statements stay tied to the old account or follow the user. (Most systems tie to account/unit.)

Implementation milestones (fast and safe)

Add billing_month and indexes/unique constraint

Build admin bulk upload (ZIP + filename mapping)

Build member list + secure PDF streaming

Enforce 3-month filter in both list + PDF endpoints

Add audit logs for bulk imports + failures

Polish UI + deployment