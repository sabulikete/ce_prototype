# Invite Resend Modal Quickstart

This document highlights the configuration toggles introduced for the Invite Resend Modal so engineers and operators can wire the feature without re-reading the full spec.

## 1. Environment Variables

Copy `server/.env.example` to `server/.env` and review the reminder/resend-specific entries:

| Variable | Default | Purpose |
|----------|---------|---------|
| `INVITE_REMINDER_CAP` | `3` | Hard limit for resend attempts per invitee before the UI disables the action (matches FR-006). |
| `INVITE_MAX_REMINDERS` | `3` | Legacy fallback read by existing services until they import the new config module; keep in sync with `INVITE_REMINDER_CAP`. |
| `INVITE_RESEND_CHANNEL_POLICY` | `mirror-original` | Controls how channels are selected when resending. `mirror-original` reuses whatever the initial invite used; `email-only` forces email-only delivery. |
| `INVITE_RESEND_RATE_LIMIT` | `5` | Number of resend attempts allowed per admin per minute, backing the rate limiter mentioned in the NFRs. |

> Tip: set these values via your secret manager in staging/production so policy tweaks do not require code changes.

## 2. Configuration Module

`server/src/config/invites.ts` centralizes reminder/resend policy:

- `inviteConfig.reminderCap` already looks for `INVITE_REMINDER_CAP` and falls back to the legacy env var if needed.
- `inviteConfig.resendChannelPolicy` normalizes the channel strategy and defaults to `mirror-original`.
- `inviteConfig.resendRateLimitPerAdmin` reads `INVITE_RESEND_RATE_LIMIT` for rate-limiter middleware.
- `resolveResendChannels()` dedupes/sanitizes the original channel list and applies the configured policy.
- `isReminderCapReached()` standardizes the comparison for server-side guardrails.

Future backend tasks (T005, T012, T013, T019) should import these helpers instead of reading `process.env` directly.

## 3. Resend Workflow

### User Flow
1. Admin navigates to **Admin → Users → Invited** tab
2. Clicks **Resend** button on a pending invite row
3. Modal opens displaying:
   - Invitee identity (name, email)
   - Invite link with copy-to-clipboard
   - Reminder count (X / cap)
   - Last sent date and sender
4. Admin clicks **Resend Invite** to trigger reminder
5. Toast confirms success; modal updates reminder count
6. If cap is reached, Resend button becomes disabled

### API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/admin/invites/:id/resend-context` | Fetch modal context (eligibility, metadata, link) |
| `POST` | `/api/admin/invites/:id/resend` | Execute resend, increment reminder count |

### Guardrails
The modal enforces these business rules client-side with server-side validation:

| Condition | UI Behavior | API Response |
|-----------|-------------|--------------|
| Invite ACCEPTED | Shows "Already Accepted" message, buttons disabled | 400 Bad Request |
| Invite REVOKED | Shows "Invite Revoked" message, buttons disabled | 400 Bad Request |
| Reminder cap reached | Shows "Cap Reached" message, Resend disabled | 400 Bad Request |

## 4. Data Model

### InviteReminder Table (Source of Truth)
```sql
CREATE TABLE InviteReminder (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  invite_id   INT NOT NULL,
  sent_by     INT NOT NULL,
  sent_at     DATETIME NOT NULL,
  channels    JSON NOT NULL,
  success     BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (invite_id) REFERENCES Invite(id),
  FOREIGN KEY (sent_by) REFERENCES User(id)
);
```

### Invite Table (Summary Columns)
- `reminder_count` - cached count for fast rendering
- `last_sent_at` - timestamp of most recent send
- `last_sent_by` - FK to User who last sent

## 5. Audit Logging

All resend attempts are logged via `server/src/utils/auditLogger.ts`:

### Success Event
```json
{
  "timestamp": "2026-01-04T12:00:00Z",
  "event": "invite.resend.success",
  "scope": "audit",
  "success": true,
  "actorId": 1,
  "inviteId": 42,
  "reminderCount": 2,
  "status": "PENDING",
  "channels": ["email"]
}
```

### Failure Event
```json
{
  "timestamp": "2026-01-04T12:00:00Z",
  "event": "invite.resend.failure",
  "scope": "audit",
  "success": false,
  "actorId": 1,
  "inviteId": 42,
  "reason": "Reminder cap of 3 reached",
  "status": "PENDING",
  "reminderCount": 3
}
```

### Log Redaction
Sensitive fields are automatically redacted:
- `inviteUrl` → `[REDACTED]`
- `token`, `inviteToken` → `[REDACTED]`
- URLs matching `/accept-invite?token=` → `[REDACTED_URL]`

## 6. Metrics

| Metric | Labels | Purpose |
|--------|--------|---------|
| `invite_resend_total` | `status` | Count of successful resends |
| `invite_resend_failed` | `status`, `reason` | Count of blocked resend attempts |

## 7. Auto-Refresh (FR-008)

The modal polls every 30 seconds to detect backend state changes:
- If invite becomes ACCEPTED while modal is open, UI updates and shows success message
- If invite is REVOKED by another admin, UI updates and disables actions

Configure via `useInviteResend({ autoRefresh: true, refreshInterval: 30000 })`.

## 8. Troubleshooting

### "Reminder cap reached" but count shows less than cap
- Check `InviteReminder` table for actual count (source of truth)
- Run `SELECT COUNT(*) FROM InviteReminder WHERE invite_id = ?` to verify
- If mismatch, cached `reminder_count` on Invite may need sync

### Resend button not appearing
- Verify invite status is PENDING (not ACCEPTED/REVOKED)
- Check user has ADMIN role (MEMBER/STAFF cannot resend)
- Confirm `resendEligible` in API response is `true`

### Modal shows stale data
- Auto-refresh interval is 30s; manual refresh via Retry button
- Check network tab for failed `/resend-context` calls
- Verify backend is returning fresh data

### Audit logs missing
- Ensure `server/src/utils/auditLogger.ts` is imported in inviteService
- Check console output for JSON audit entries
- Verify log aggregator is parsing JSON format

## 9. Verification Checklist

- [ ] `.env` (or secret store) defines the four variables above.
- [ ] `inviteConfig.reminderCap` returns the expected value when you run `npm run ts-node ./src/scripts/print-config.ts` (or similar REPL check).
- [ ] Channel policy behaves as expected in staging (toggle to `email-only` temporarily to verify).
- [ ] Resend modal opens and displays correct invite metadata.
- [ ] Resend action increments reminder count and updates UI.
- [ ] Cap-reached invites show guardrail message and disabled buttons.
- [ ] Audit logs appear with redacted URLs in production logs.
- [ ] Metrics dashboard shows `invite_resend_total` and `invite_resend_failed`.
