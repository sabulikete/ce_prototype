The basic flow
1) Create the ticket (QR generation)

When someone registers/buys a ticket, the system creates a ticket record in the database, like:

ticketId (unique)

eventId

userId (optional)

status = unused / used

expiresAt (optional)

Then you generate a QR code that contains:

A random “ticket token”

Example QR content: TICKET: 8f3a...random...c21

Token is stored in the database and mapped to that ticket



2) Scan at the entrance (scanner app)

At the gate, staff opens the scanner app (this can be a mobile app using the camera).

The camera reads the QR string (token or signed payload)

The scanner app sends it to your backend:

POST /api/checkin

Body: { qrData, deviceId, gateId }

3) Validate on the backend

Your server checks:

Ticket exists?

Matches the correct event?

Not expired?

Not already used?

If valid:

Mark ticket as used

Save a check-in log: time, gate, staff/device

Return: { ok: true, message: "Valid — entry allowed" }

If invalid:

Return the reason: already used / not found / wrong event / expired

4) Show result instantly

Scanner app displays After scan:

Large name text (primary)

Ticket number (secondary)

Status badge

Buttons:

✅ Confirm Check-in (only if status=valid)

🔁 Scan next

Optional: “View details” (shows email, ticket type, etc.)

Why you need a backend (important)

If the scanner only checks “does this look like a ticket” locally, people can:

screenshot a QR

copy/share it

reuse it

A backend lets you enforce one-time use and stop duplicates.

Preventing common problems
Stop “QR sharing” / reuse

Make each QR represent a unique token

On first successful scan → mark as USED

After that → “Already used”

Handle slow/no internet

Two approaches:

Online-first (recommended): scanner must have data

Hybrid: scanner can “preload” valid ticket list or verify signatures offline, then sync later (more complex and still tricky for preventing re-use across multiple gates)

Multiple entrance gates (race conditions)

If two scanners scan the same ticket at the same time:

Your backend should enforce a single atomic update:

“Mark as used only if currently unused”

If update count = 0 → someone else already used it

Minimal tech stack (simple version)

Admin/Web app: create event + generate tickets + display QR

Backend (Node/Express works great): endpoints for ticket creation + check-in

Database (MySQL): tickets + checkin_logs

Scanner app: mobile web app (PWA) or native app using phone camera

Endpoints you’ll typically have

POST /events/:id/tickets → create ticket + return QR data

GET /tickets/:id (optional) → ticket details

POST /checkin → validate + mark used

QR content recommendation

For a simple, secure build:

Put only a random token in the QR (not user info)

Example: qrData = "evt_123|tok_8f3a..."

Store token_hash in DB (hash it like a password)