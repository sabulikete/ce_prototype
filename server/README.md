# Server (API)

This package contains the Node.js/Express API, Prisma schema, and migration scripts.

## Setup

1. `cd server`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and configure:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - Invitation settings (`INVITE_TTL_DAYS`, `INVITE_MAX_REMINDERS`)
4. Apply database migrations: `npx prisma migrate deploy`
5. Seed local data: `npx prisma db seed`
6. Start the dev server: `npm run dev`

## Invite Lifecycle Migration (2026-01-04)

This release introduces the `InviteStatus` enum plus lifecycle columns (`status`, `revoked_at`, `reminder_count`, `last_sent_at`, `pending_email_key`). Follow these steps when upgrading any environment:

1. `cd server`
2. Apply schema changes:
   ```sh
   npx prisma migrate deploy
   ```
3. Backfill existing rows to populate the new columns and dedup pending invites:
   ```sh
   npx ts-node scripts/backfill-invite-status.ts
   ```
4. Rerun the seed (optional but recommended for QA fixtures):
   ```sh
   npx prisma db seed
   ```

### Verifications
- `Invite` rows show meaningful `status` values (PENDING/EXPIRED/REVOKED/ACCEPTED).
- Only one pending invite exists per email (enforced by `pending_email_key`).
- `scripts/backfill-invite-status.ts` logs the count of invites updated per status.

### Rollback

If a rollback is required:

1. Revert the application code to the previous commit.
2. Reapply the prior schema by marking the migration as rolled back and deploying:
   ```sh
   npx prisma migrate resolve --rolled-back "20260104053000_invite_lifecycle_fields"
   npx prisma migrate deploy
   ```
3. Validate that the `Invite` table no longer contains the added columns before restarting services.

### Related Scripts
- `scripts/backfill-invite-status.ts` – Idempotent script to derive invite statuses and dedup pending invites.
- `prisma/seed.ts` – Seeds an admin user plus representative invite fixtures (pending, expired, accepted) for manual QA.

## Invite Resend Feature

Admins can resend pending invites via the Admin Users page. The feature includes:

### Configuration
Set these environment variables (or use defaults):

| Variable | Default | Purpose |
|----------|---------|---------|
| `INVITE_REMINDER_CAP` | `3` | Maximum resend attempts per invite |
| `INVITE_RESEND_CHANNEL_POLICY` | `mirror-original` | Channel selection strategy |
| `INVITE_RESEND_RATE_LIMIT` | `5` | Resends per admin per minute |

### API Endpoints

```
GET  /api/admin/invites/:id/resend-context  → Modal metadata + eligibility
POST /api/admin/invites/:id/resend          → Execute resend
```

### Audit Trail
Every resend attempt is logged to stdout as JSON:
- `invite.resend.success` – Successful resend with reminder count
- `invite.resend.failure` – Blocked attempt with reason

Sensitive fields (invite URLs, tokens) are automatically redacted.

### Metrics
- `invite_resend_total` – Count of successful resends
- `invite_resend_failed` – Count of blocked attempts

See `specs/001-invite-resend-modal/quickstart.md` for detailed documentation.
