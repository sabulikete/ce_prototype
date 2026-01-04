# Tasks: Invited Users Status Visibility

**Input**: Design documents from `/specs/001-invited-user-status/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

Tests are manual for this MVP (per clarification). Document every manual QA run in `specs/001-invited-user-status/quickstart.md`.

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Configure invite TTL and reminder limits in server/.env.example and document in specs/001-invited-user-status/quickstart.md
  - Goal: Ensure every environment exposes `INVITE_TTL_DAYS`, `INVITE_MAX_REMINDERS`, and related settings before backend changes.
  - Files: server/.env.example, specs/001-invited-user-status/quickstart.md
  - Acceptance Checks: Env sample contains the new variables with safe defaults; quickstart lists setup steps referencing them.
  - Dependencies: None

- [x] T002 Seed representative invitation data in server/prisma/seed.ts
  - Goal: Provide pending, expired, and accepted invite examples for local QA without manual DB edits.
  - Files: server/prisma/seed.ts
  - Acceptance Checks: Running `npx prisma db seed` creates at least one invite per status and logs their emails for testers.
  - Dependencies: T001

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T003 Update Prisma schema with InviteStatus enum and new fields in server/prisma/schema.prisma
  - Goal: Persist invitation lifecycle data (status, revoked_at, reminder_count, last_sent_at) as the backend source of truth.
  - Files: server/prisma/schema.prisma
  - Acceptance Checks: `npx prisma validate` passes; generated client exposes `InviteStatus` enum and new columns.
  - Dependencies: T002

- [x] T004 Generate Prisma migration + backfill script in server/prisma/migrations and server/scripts/backfill-invite-status.ts
  - Goal: Safely transform existing data to the new schema, tagging invites as PENDING/EXPIRED/ACCEPTED.
  - Files: server/prisma/migrations/**, server/scripts/backfill-invite-status.ts
  - Acceptance Checks: Migration applies cleanly on dev DB; script updates historical rows without errors and can be re-run idempotently.
  - Dependencies: T003

- [x] T005 Document migration + rollback steps in server/README.md (or docs/migrations.md)
  - Goal: Provide operators with upgrade instructions covering apply, backfill, and revert procedures.
  - Files: server/README.md (or docs/migrations.md)
  - Acceptance Checks: Document lists commands for migrate/backfill/rollback and references the new script; reviewed by peer.
  - Dependencies: T004

- [x] T006 Align TypeScript DTOs with admin-users contract in server/src/types/adminUsers.ts
  - Goal: Keep backend types synchronized with contracts/admin-users.yaml for the shared `UserInviteRow` shape.
  - Files: server/src/types/adminUsers.ts, specs/001-invited-user-status/contracts/admin-users.yaml
  - Acceptance Checks: DTO exports match OpenAPI schema (source, status, invitation metadata) and compile without `any`.
  - Dependencies: T004

- [x] T026 Implement invite deduplication + conflict flagging in server/prisma/schema.prisma and server/src/services/inviteService.ts
  - Goal: Enforce one pending invite per email (w/ configurable overrides) and surface conflict flags for linked deactivated users.
  - Files: server/prisma/schema.prisma, server/prisma/migrations/**, server/src/services/inviteService.ts
  - Acceptance Checks: Prisma constraints prevent duplicate pending invites; service exposes conflict metadata consumed by DTOs; manual tests show deduped records.
  - Dependencies: T004

- [x] T007 Harden RBAC and rate limiting for admin routes in server/src/routes/adminUsers.ts and middleware
  - Goal: Guarantee only Admin/Super Admin can hit `/api/admin/users` and invite mutation routes, with existing rate limiter applied.
  - Files: server/src/middleware/auth.ts, server/src/routes/adminUsers.ts
  - Acceptance Checks: Unauthorized roles receive 403; limiter config logged for new routes; manual curl confirms behavior.
  - Dependencies: T006

---

## Phase 3: User Story 1 - Track Pending Invites (Priority: P1) 🎯 MVP

**Goal**: Admins can open the user management page and immediately see every pending invite with status `Invited`.
**Independent Test**: Load the admin page after seeding invites; verify pending invite rows appear with correct status even if no active users exist.

- [x] T008 [P] [US1] Implement union query + mapper in server/src/services/adminUserService.ts
  - Goal: Return combined `User` and `Invite` rows honoring the `view` filter (default `invited`).
  - Files: server/src/services/adminUserService.ts, server/src/repositories/** if applicable
  - Acceptance Checks: Service returns deduped invite rows (one per email) with null joinedAt/lastLogin; pagination + search still work.
  - Dependencies: T006, T026

- [x] T009 [US1] Update `/api/admin/users` controller to use the new service in server/src/controllers/adminUserController.ts
  - Goal: Wire endpoint to union service, enforce default `view=invited`, and surface pagination metadata.
  - Files: server/src/controllers/adminUserController.ts, server/src/routes/adminUsers.ts
  - Acceptance Checks: Manual request shows invite rows; query params (`view`, `page`, `search`) behave per contract.
  - Dependencies: T008, T007

- [x] T010 [P] [US1] Update admin data hook/API client in client/src/services/api.ts (or context hook)
  - Goal: Fetch `/api/admin/users` with the new DTO and default `view=invited` on initial load.
  - Files: client/src/services/api.ts, client/src/context/AuthContext.jsx (if token handling touched)
  - Acceptance Checks: Network tab shows correct request; typing reflects union DTO shape without `any`.
  - Dependencies: T009

- [x] T011 [US1] Render invited rows in the admin table within client/src/pages/Admin/UserManagement
  - Goal: Show invite rows with email, placeholder name, role, status badge, joined/last login placeholders.
  - Files: client/src/pages/Admin/UserManagement/index.tsx (or .tsx), client/src/components/Layout/Table/**
  - Acceptance Checks: UI lists seeded invites with `Invited` badges; placeholder text appears when name missing.
  - Dependencies: T010

- [x] T012 [US1] Document manual QA steps for pending invite visibility in specs/001-invited-user-status/quickstart.md
  - Goal: Provide repeatable instructions for verifying US1 without automated tests.
  - Files: specs/001-invited-user-status/quickstart.md
  - Acceptance Checks: Section lists login steps, expected table view, and verification screenshot or notes.
  - Dependencies: T011

---

## Phase 4: User Story 2 - Filter for Invited Users (Priority: P2)

**Goal**: Admins can toggle between Invited, Active, and Inactive views without losing context; Invited tab loads by default.
**Independent Test**: Refresh the page to confirm Invited tab loads; switch to Active, then back to Invited, verifying data + filters persist per tab.

- [x] T013 [P] [US2] Build tabbed navigation component defaulting to Invited in client/src/components/UI/Tabs/
  - Goal: Provide accessible tab UI that controls the current dataset.
  - Files: client/src/components/UI/Tabs/AdminUserStatusTabs.tsx
  - Acceptance Checks: Tabs are keyboard navigable and reflect current selection visually; default selection is Invited.
  - Dependencies: T011

- [x] T014 [US2] Wire tab state to API filter in client/src/pages/Admin/UserManagement
  - Goal: Trigger data refetch with `view` query when tab changes while keeping pagination intact.
  - Files: client/src/pages/Admin/UserManagement/index.tsx or associated hooks
  - Acceptance Checks: Switching tabs issues API calls with matching `view`; results update without full page reload.
  - Dependencies: T013, T010

- [x] T015 [US2] Persist search/filter inputs per tab context in client/src/pages/Admin/UserManagement/state.ts
  - Goal: Ensure clearing filters returns to default active-only view while preserving invite filters when revisiting the Invited tab.
  - Files: client/src/pages/Admin/UserManagement/state.ts (or new hook), client/src/components/Filters/**
  - Acceptance Checks: Search terms remain scoped to the tab; clearing filters triggers default active list per acceptance scenario.
  - Dependencies: T014

- [x] T016 [US2] Record manual QA scenario for tab + filter behavior in specs/001-invited-user-status/quickstart.md
  - Goal: Capture steps for verifying tab switching, filter persistence, and default behavior.
  - Files: specs/001-invited-user-status/quickstart.md
  - Acceptance Checks: Checklist covers both acceptance scenarios and expected results.
  - Dependencies: T015

---

## Phase 5: User Story 3 - Audit Invitation Details (Priority: P3)

**Goal**: Super admins can inspect inviter info, reminder counts, expiration state, and execute resend/revoke actions from the Invited tab.
**Independent Test**: View an invite older than 14 days to see metadata; resend and revoke actions update status without reloading entire app.

- [x] T017 [P] [US3] Extend DTOs/service to include invitation metadata in server/src/services/adminUserService.ts
  - Goal: Populate `invitation` object (sentAt, expiresAt, reminderCount, inviter info) for invite rows.
  - Files: server/src/services/adminUserService.ts, server/src/types/adminUsers.ts
  - Acceptance Checks: API response includes metadata values and conflict indicators validated against DB; null-safe for user rows.
  - Dependencies: T008, T006, T026

- [x] T018 [US3] Implement resend endpoint logic in server/src/controllers/inviteResendController.ts
  - Goal: POST `/api/admin/invites/{id}/resend` increments reminder_count, updates last_sent_at, and triggers mailer hook/log.
  - Files: server/src/controllers/inviteResendController.ts, server/src/routes/adminInvites.ts, server/src/services/inviteService.ts
  - Acceptance Checks: Endpoint returns 200 with updated invite; prevents resends past max reminders; logs actor + status.
  - Dependencies: T017, T007

- [x] T019 [US3] Implement revoke endpoint logic in server/src/controllers/inviteRevokeController.ts
  - Goal: PATCH `/api/admin/invites/{id}/revoke` sets status REVOKED, stamps revoked_at, and records reason.
  - Files: server/src/controllers/inviteRevokeController.ts, server/src/services/inviteService.ts
  - Acceptance Checks: Endpoint returns updated invite; rejecting already accepted invites with 409; audit log entry persists.
  - Dependencies: T017, T007

- [x] T020 [P] [US3] Display invitation metadata columns/badges in client/src/pages/Admin/UserManagement table
  - Goal: Show sent date, inviter name, reminder count, expiration badge within Invited tab rows.
  - Files: client/src/pages/Admin/UserManagement/components/InviteRow.tsx
  - Acceptance Checks: UI renders metadata with clear formatting; expired/revoked statuses and duplicate/conflict badges display consistently.
  - Dependencies: T017, T011

- [x] T021 [US3] Add resend/revoke actions with toast feedback in client/src/pages/Admin/UserManagement/actions.tsx
  - Goal: Provide buttons/dropdown per invite row to call new endpoints, show success/error toasts, and refetch data.
  - Files: client/src/pages/Admin/UserManagement/actions.tsx, client/src/context/ToastContext.tsx
  - Acceptance Checks: Actions disabled when not allowed (max reminders, revoked); toasts describe outcome; table refreshes post-action.
  - Dependencies: T018, T019, T020

- [x] T022 [US3] Document manual QA for metadata/resend/revoke flows in specs/001-invited-user-status/quickstart.md
  - Goal: Capture reproducible steps covering metadata display, resend, and revoke behaviors.
  - Files: specs/001-invited-user-status/quickstart.md
  - Acceptance Checks: Checklist notes preconditions (seeded invites), steps, and expected status transitions.
  - Dependencies: T021

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T023 [P] Update documentation (quickstart + admin README) with new workflows and screenshots
  - Goal: Ensure stakeholders know how to access Invited tab, resend, and revoke invites.
  - Files: specs/001-invited-user-status/quickstart.md, product_specs/product.md (admin section), README.md
  - Acceptance Checks: Docs mention Invited tab default, actions, and manual QA references; screenshots or diagrams updated if available.
  - Dependencies: T022

- [x] T024 [P] Run tests/e2e/full-flow.ts and capture results in specs/001-invited-user-status/quickstart.md
  - Goal: Validate no regressions in the broader admin flow despite manual-testing strategy.
  - Files: tests/e2e/full-flow.ts, specs/001-invited-user-status/quickstart.md
  - Acceptance Checks: Test run documented with pass/fail; issues filed if failures occur.
  - Dependencies: T021

- [x] T025 Add structured logging/metrics for invite actions in server/src/middleware/logging.ts and services
  - Goal: Emit logs for resend/revoke (actor, inviteId, newStatus) and increment counters for monitoring.
  - Files: server/src/middleware/logging.ts, server/src/services/inviteService.ts
  - Acceptance Checks: Logs appear in dev console with structured JSON; metric hooks (even if stub) note TODO for production wiring.
  - Dependencies: T018, T019

---

## Dependencies & Execution Order

1. Phase 1 Setup (T001–T002) has no prerequisites and must finish before schema work.
2. Phase 2 Foundational (T003–T007) depends on setup data (seed + env). All user stories depend on completion of these tasks.
3. User Story phases can start after Phase 2:
   - US1 (T008–T012) is the MVP slice and should complete before other stories.
   - US2 (T013–T016) depends on US1 UI foundation (T011).
   - US3 (T017–T022) depends on US1 backend + UI plus security work.
4. Polish tasks (T023–T025) execute after all user stories deliverables are stable.

## Parallel Opportunities

- Schema migration (T003) and seed updates (T002) must be sequential, but T006 and T007 can run in parallel once migration + docs are ready.
- Within US1, backend service (T008) and frontend API client (T010) can proceed in parallel once controller contract is defined.
- US3 metadata rendering (T020) can begin as soon as service outputs (T017) are available, even while resend/revoke endpoints finalize.

## Implementation Strategy

1. Finish Setup + Foundational phases to establish schema, migrations, and contract alignment.
2. Deliver US1 end-to-end (backend + UI + QA) to achieve the MVP: admins see pending invites immediately.
3. Layer in US2 tabs/filters so admins can switch between cohorts without confusion.
4. Complete US3 metadata + actions to satisfy audit requirements and support invite remediation.
5. Close with polish tasks (docs, e2e run, logging) before handoff.
