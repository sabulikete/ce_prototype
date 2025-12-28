Security and access control

RBAC everywhere: enforce roles on the backend (not just the UI).

TENANT_ADMIN for issuing tickets and managing events

STAFF_SCANNER for scan endpoints only

Tenant isolation: every query must include tenant_id. Add a shared DB helper so nobody forgets.

Never store raw tokens: store only SHA-256(token) (token_hash). Compare hashes on scan.

QR payload contains no PII: no name/email inside QR. Name comes only from server.

Rate limit sensitive endpoints:

login, password reset request, invite accept

scan-preview/checkin (light rate limit per device/user to reduce abuse)

Idempotency & atomic check-in: check-in must be a single atomic update (WHERE checked_in_at IS NULL) to prevent double entry.

Data integrity and correctness

Sequential ticket numbers done with DB locks: use events.next_ticket_number + SELECT ... FOR UPDATE inside a transaction.

Enforce uniqueness in DB:

UNIQUE(event_id, ticket_number)

UNIQUE(token_hash)

500 ticket cap enforced transactionally: check current active count in the same transaction as issuing.

Audit logs are append-only: checkins should never be edited/deleted by normal admins.

Scanner UX and operational reliability

Two-step scan is the right choice: preview → show name → confirm. Prevents wrong-person check-ins.

Debounce scans: once a QR is detected, pause camera until user hits “Scan next”.

Device identity: send deviceId (e.g., “GateA-iPhone12”) with check-ins to diagnose issues.

Time zone discipline: store timestamps in UTC; display in local time (Asia/Manila) in UI.

Privacy best practices

Least disclosure: scanner UI should only show what’s needed: name + ticket # + status.

Logging hygiene: never log tokens, reset tokens, or full QR payloads. If needed, log ticketId and status only.

Backend engineering best practices

Input validation: validate every request body (e.g., Zod). Reject malformed QR payloads.

Central error format: consistent error codes (INVALID, WRONG_EVENT, LIMIT_EXCEEDED) so frontend logic is clean.

Database access layer: wrap queries in helpers that require tenant_id so it can’t be omitted.

Migrations: use a migration tool (Prisma Migrate, Knex, or similar). Never “manual change” prod schema.

Config via env vars: JWT secrets, DB creds, email provider keys. No secrets in git.

Frontend best practices

Role-gated routes: hide admin/scanner routes in UI, but still rely on backend auth.

Optimistic UI only where safe: never “assume checked-in” until confirm response returns.

CSV import safety:

preview parsed rows before upload

show per-row errors from backend (partial success)

allow re-download of error rows as CSV (nice-to-have)

DevOps and production readiness

Environments: at least dev + prod (staging optional but helpful).

Backups: daily automated DB backups + retention (7–30 days). Test restoring at least once.

Observability:

structured logs (requestId, tenantId, userId, eventId, ticketId)

uptime monitoring for API

Performance:

index the scan lookup path: token_hash must be indexed (unique index already covers it)

keep scan endpoints fast (<200ms target)

QA/testing best practices (very relevant for you)

Critical test cases (must automate):

duplicate scan race condition (two scanners hit confirm at same time)

wrong event QR scanned

invalid token

already used ticket

limit 500 enforcement (499 + issue 2 should fail)

Load test scan endpoints: simulate peak entry (e.g., 5–20 scans/sec) to ensure DB holds up.

The 10 “non-negotiables” I’d enforce as CTO

Hash tokens (never store raw)

QR contains no PII

Backend RBAC + tenant scoping on every endpoint

Transactional ticket issuance with event lock

Atomic check-in update (checked_in_at IS NULL)

Unique constraints for ticketNo and token_hash

Rate limiting on auth + scan

Audit log append-only

UTC timestamps; local display

Backups + restore test