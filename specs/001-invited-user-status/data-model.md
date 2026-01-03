# Data Model - Invited Users Status Visibility

## 1. Entities & Fields

| Entity | Description | Key Fields |
| --- | --- | --- |
| `Invite` (existing) | Represents an administrator-issued invitation | `id`, `email`, `role`, `unit_id`, `token_hash`, `expires_at`, `used_at`, `created_by`, `created_at`, **`status` (NEW enum)**, **`revoked_at` (NEW DateTime?)**, **`reminder_count` (NEW Int @default(0))**, **`last_sent_at` (NEW DateTime)`** |
| `User` (existing) | Authenticated account created after invite acceptance | `id`, `email`, `role`, `status`, `created_at`, `last_login`, `joined_date` |
| `UserInviteView` (virtual DTO) | Backend-union of `Invite` and `User` rows for table rendering | `source` (`"INVITE" | "USER"`), `id`, `email`, `full_name` (nullable), `role`, `status`, `joined_at`, `last_login`, `invitation`: `{ sent_at, expires_at, reminder_count, inviter_name, inviter_role }` |

## 2. Enumerations

### `InviteStatus` (NEW)
- `PENDING` (default)
- `EXPIRED`
- `REVOKED`
- `ACCEPTED`

### `UserStatus` (existing, no schema change)
- `ACTIVE`
- `SUSPENDED`
- `INVITED` (used only for pre-provisioned accounts; union logic prefers `InviteStatus` for invites)

## 3. Relationships

- `User (creator)` 1 --- * `Invite` (createdInvites)
- `User (account)` 1 --- 1 `Invite` via matching `email` once accepted (logic-level association, not FK)
- `User` 1 --- * `BillingStatement`, `Ticket` (no change)

## 4. Validation Rules

1. `email` unique per active invitation; new invites to existing email must either update the old invite (if `status` != `ACCEPTED`) or be rejected.
2. `expires_at` must be >= `created_at + config.inviteTTL` (default 14 days).
3. `reminder_count` increments only when resend API succeeds; guard with max (e.g., 5) to prevent spam.
4. `last_sent_at` updates on initial creation and on resend to support audit UI.
5. `revoked_at` is set only by admins with appropriate permission; when present, `status` must equal `REVOKED`.
6. `status` transitions must follow state machine below.

## 5. State Transitions

```text
PENDING --(expires_at passed)--> EXPIRED
PENDING --(admin revoke)--> REVOKED
PENDING --(user registers + invite consumed)--> ACCEPTED
EXPIRED --(admin resend)--> PENDING (new expires_at, reminder_count++)
REVOKED --(admin reinstate)--> PENDING (revoked_at cleared)
```

## 6. Derived View (`UserInviteView`)

Backend service composes:
- **Invites**: map to table rows with `status = Invited`, `joined_at = null`, `last_login = null`, `invitation.sent_at = created_at`.
- **Users**: reuse existing `User` rows; include `invitation` info only if their `Invite` row exists and has `status = ACCEPTED`.

## 7. Migration Strategy

1. Create new enum `InviteStatus` and add `status InviteStatus @default(PENDING)` to `Invite` model.
2. Add nullable `revoked_at DateTime?`, `reminder_count Int @default(0)`, `last_sent_at DateTime @default(now())`.
3. Backfill existing invites: set `status = ACCEPTED` where `used_at IS NOT NULL`; `status = EXPIRED` where `expires_at < now()`; otherwise `PENDING`. Set `last_sent_at = created_at`.
4. Generate Prisma migration + SQL script, run locally, then through deployment pipeline.

## 8. Reporting Requirements

- All invitation mutations must update `updated_at` (consider adding if missing) or rely on `last_sent_at`/`revoked_at` to detect changes.
- Audit logs capture `status` transition actor + timestamp (via controller logging).
