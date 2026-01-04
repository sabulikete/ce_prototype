# Data Model: Invite Resend Modal

**Updated**: 2026-01-04  
**Migration**: `20260104080029_invite_reminders`

## Overview

This document describes schema changes supporting the Invite Resend Modal feature, specifically the audit trail for resend attempts and cached summary columns for fast table rendering.

## Source of Truth: `InviteReminder`

The `InviteReminder` table is the **authoritative record** of every resend attempt. Each row represents one attempt, successful or failed.

```prisma
model InviteReminder {
  id         Int      @id @default(autoincrement())
  invite_id  Int
  invite     Invite   @relation(...)
  sent_by    Int      // admin user who triggered resend
  sent_at    DateTime @default(now())
  channels   String   // JSON array, e.g. '["email"]' or '["email","sms"]'
  success    Boolean  @default(true)
  error_code String?  // provider error code if delivery failed

  @@index([invite_id, sent_at])
}
```

### Key Points

- **Immutable**: Rows are never updated or deleted (except via cascade when parent invite is deleted).
- **Channels stored as JSON**: Allows flexible multi-channel delivery without schema changes.
- **Error tracking**: `success=false` with `error_code` captures provider failures for debugging.

## Cached Summary Columns on `Invite`

To avoid aggregating `InviteReminder` rows on every table load, we maintain denormalized summary columns on the `Invite` model:

| Column | Type | Purpose |
|--------|------|---------|
| `reminder_count` | Int | Total successful resends; used for cap enforcement and UI display |
| `last_sent_at` | DateTime | Timestamp of most recent send (original or resend) |
| `last_sent_by` | Int? | FK to User who performed the last send |

### Sync Rules

1. **On resend success**: Increment `reminder_count`, update `last_sent_at` and `last_sent_by` in the same transaction that inserts the `InviteReminder` row.
2. **On resend failure**: Insert `InviteReminder` with `success=false`; do **not** increment `reminder_count` (failed attempts don't count toward cap).
3. **Reconciliation**: If data drifts, `reminder_count` can be recalculated as `COUNT(*) FROM InviteReminder WHERE invite_id = ? AND success = true`.

## Relationships

```text
User (1) ───────────────────────────────────────────┐
  │                                                  │
  │ createdInvites (creator)                         │ sentInvites (last_sent_by)
  ▼                                                  ▼
Invite (N) ─────────────────────────────────────────┘
  │
  │ reminders
  ▼
InviteReminder (N)
```

## Migration Notes

- **New column `last_sent_by`**: Nullable FK to User; existing rows will have `NULL` (unknown sender).
- **New table `InviteReminder`**: Empty on fresh migrations; backfill script not required since historical attempts were not tracked.
- **No breaking changes**: Existing queries selecting from `Invite` continue to work; new columns are additive.

## Usage in Code

```typescript
import { inviteConfig, resolveResendChannels, isReminderCapReached } from '../config/invites';

// Check eligibility
if (isReminderCapReached(invite.reminder_count)) {
  throw new InviteActionError('Maximum reminders reached', 400);
}

// Determine channels
const channels = resolveResendChannels(originalChannels);

// Transactional insert + update
await prisma.$transaction([
  prisma.inviteReminder.create({
    data: { invite_id, sent_by: actorId, channels: JSON.stringify(channels), success: true },
  }),
  prisma.invite.update({
    where: { id: invite_id },
    data: {
      reminder_count: { increment: 1 },
      last_sent_at: new Date(),
      last_sent_by: actorId,
    },
  }),
]);
```
