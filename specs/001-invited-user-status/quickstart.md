# Quickstart - Invited Users Status Visibility

## Prerequisites
1. Node.js 20+ and PNPM/Yarn/NPM (repo currently uses npm scripts).
2. MySQL instance with `DATABASE_URL` configured (see `server/.env.example`).
3. Copy `server/.env.example` to `server/.env` and set:
	- `DATABASE_URL` to match your local MySQL instance.
	- `JWT_SECRET` to a unique development secret.
	- `INVITE_TTL_DAYS` (default 14) to control when pending invites expire.
	- `INVITE_MAX_REMINDERS` (default 5) to cap resend attempts.
4. Seed admin user + invitation data (`npx prisma db seed` under `server`).

## Backend
1. `cd server`
2. Install deps: `npm install`
3. Apply migrations: `npx prisma migrate dev`
4. Seed sample data: `npx prisma db seed`
5. Start API: `npm run dev`

### Seeded invitations (after `npx prisma db seed`)

- `pending.invite@example.com` → Pending invite expiring in ~`INVITE_TTL_DAYS` days
- `expired.invite@example.com` → Expired invite (manually test default tab handling)
- `accepted.invite@example.com` → Accepted invite (removed from pending list after refresh)

Tokens for the above invites are printed in the seed output for manual QA; rerun the seed whenever you need to reset their state.

## Manual QA log

| Date (UTC) | Step | Notes |
| --- | --- | --- |
| 2026-01-04 05:25 | `npx prisma db seed` | Output confirmed admin bootstrap plus three invite fixtures with tokens:<br>- Pending `pending.invite@example.com` token `cfb48580ec6a4b7eaa346e634e8b4e46`<br>- Expired `expired.invite@example.com` token `5241a347117ee839a89698c55b0ac397`<br>- Accepted `accepted.invite@example.com` token `69864dd9396569ea67cb0e930fd18358` |
| 2026-01-04 05:36 | `npx prisma db seed` | Verified schema/backfill changes; seed logged:<br>- Pending token `9a0f45f36be4110e66e78a7cd1cdb1ee`<br>- Expired token `da83c888fb43ae755ca588f68b3c459a`<br>- Accepted token `ea21b93857d4346c95181bc59f1eb468` |
| 2026-01-04 06:14 | `TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}' npx ts-node tests/e2e/full-flow.ts` | Full-flow regression passed (invite → accept → event → ticket scan). Logs show successful resend/revoke logging coverage. |

## Manual QA Scenario – Pending Invite Visibility (US1)

1. Run `npx prisma db seed` inside `/server` to ensure the pending invite fixtures exist.
2. Start both API (`npm run dev` in `server`) and client (`npm run dev` in `client`).
3. Sign in as `admin@example.com` (password `admin`).
4. Navigate to **Admin → User Management**.
5. Confirm the **Invited** tab loads by default and displays `pending.invite@example.com` with an `Invited` badge, sent date, reminder count, and expiration metadata.
6. Click **Refresh** to confirm the list re-fetches without leaving the page.
7. Use the search box to filter for `expired.invite@example.com` and verify the empty-state messaging clarifies that only pending invites appear.
8. Switch to **Active** and **Inactive** tabs; ensure invite rows disappear and only registered users remain.

## Manual QA Scenario – Tab Navigation & Filter Persistence (US2)

1. Follow the setup steps above to run both API and client, then sign in as `admin@example.com`.
2. Confirm the **Invited** tab renders by default and lists seeded pending invites.
3. Switch to the **Active** tab and use the search box to filter for `admin`; note the filtered rows.
4. Toggle back to **Invited** and apply a different search (e.g., `pending`), then switch to **Inactive** to verify the invite-specific search persists when returning to **Invited**.
5. Click **Clear Filters** in the toolbar and confirm the UI snaps to the **Active** tab with an empty search state and page 1 while leaving the Invited search untouched.
6. Reopen the **Invited** tab to confirm its prior search/filter inputs are restored, demonstrating per-tab persistence.

## Manual QA Scenario – Invitation Metadata & Actions (US3)

1. Seed data and log in as `admin@example.com`, then open **Admin → User Management** (Invited tab).
2. Inspect a pending invite and verify the metadata panel shows Sent date, Last Sent date, reminder count with max, inviter name/role, and any conflict badges.
3. Locate an invite that is older than the configured TTL (e.g., `expired.invite@example.com`) and confirm the Lifecycle column highlights the Expired badge and shows the original expiry date.
4. Click **Resend** on a pending or expired invite and observe the success toast; confirm reminder count increments and the Last Sent timestamp refreshes after the table refetches.
5. Click **Revoke** on an invite, provide a short reason when prompted, and ensure the row updates with a Revoked badge plus Revoked date while the action buttons disable.
6. Attempt to resend a revoked invite to confirm the action is disabled and the API prevents the operation (toast should surface the error message).

## Automated Regression – Full Flow (US1–US3)

1. Start the API (`npm run dev` inside `/server`) and ensure the database is seeded.
2. In a separate terminal from the repo root, run `TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}' npx ts-node tests/e2e/full-flow.ts`.
3. The script provisions an invite, accepts it, issues a ticket, and performs a check-in; treat a clean run as the regression signal and append its result to the Manual QA Log table above.

## Frontend
1. `cd client`
2. Install deps: `npm install`
3. Start dev server: `npm run dev`
4. Access the Admin UI at `http://localhost:5173` (adjust per Vite output)

## Feature Verification Checklist
1. Login as admin.
2. Navigate to **Admin → User Management**.
3. Confirm the default tab shows **Invited** users.
4. Switch between **Active** and **Inactive** tabs; verify data changes with server refetches.
5. Trigger resend/revoke actions and ensure statuses update without manual refresh.
