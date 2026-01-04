---
description: "Task list for Invite Resend Modal implementation"
---

# Tasks: Invite Resend Modal

**Input**: Design documents from `/specs/001-invite-resend-modal/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md (schema notes), contracts/openapi-invite-resend.yaml

**Tests**: Critical backend + frontend tests are explicitly included for high-risk flows (resend eligibility, modal UX, guardrails, audit logging).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configure environment knobs and documentation before touching core logic.

- [X] T001 Define `INVITE_REMINDER_CAP` + channel policy defaults in `server/src/config/invites.ts`, document usage in `server/.env.example` and `specs/001-invite-resend-modal/quickstart.md`.
- [X] T002 [P] Create baseline `specs/001-invite-resend-modal/contracts/openapi-invite-resend.yaml` with stubs for `GET /api/admin/invites/:id/resend-context` (modal metadata) and `POST /api/admin/invites/:id/resend`, documenting that the GET route is resend-specific.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, seeds, contracts, and shared services required by every user story.

- [X] T003 Update `server/prisma/schema.prisma` + create `server/prisma/migrations/*_invite_reminders` to add the `invite_reminders` history table (source of truth) and new `last_sent_at`, `reminder_count`, `last_sent_by` cache columns on `Invites`; describe the relationship in `specs/001-invite-resend-modal/data-model.md`.
- [X] T004 [P] Backfill reminder metadata defaults inside `server/prisma/seed.ts` (set counts to 0, dates null) so legacy invite rows remain valid post-migration.
- [X] T005 [P] Implement reminder policy helpers in `server/src/services/inviteService.ts` (eligibility, next-send calculation, channel mirroring) that treat `invite_reminders` as the source of truth while keeping the invite summary columns in sync; export typed config from `server/src/config/invites.ts`.
- [X] T006 [P] Finalize OpenAPI request/response/error schemas in `specs/001-invite-resend-modal/contracts/openapi-invite-resend.yaml` and sync shared types used by `server/src/routes/admin/inviteRoutes.ts` and `client/src/services/api/invites.ts`.

**Checkpoint**: Database + contracts ready; user stories can proceed in parallel.

---

## Phase 3: User Story 1 - Identify invited users quickly (Priority: P1) 🎯 MVP

**Goal**: Ensure the Invited tab exposes full identity details and a clearly visible Resend action for eligible invitees.

**Independent Test**: Load sample invites and verify every row shows full name + email, and eligible rows display the Resend button without hover tricks.

### Implementation for User Story 1

- [X] T007 [P] [US1] Extend `server/src/controllers/admin/inviteController.ts` + `server/src/services/inviteService.ts` list queries to return `fullName`, `primaryEmail`, status, reminder count (from cached columns), and `resendEligible` flags driven by policy helpers.
- [X] T008 [P] [US1] Regenerate `client/src/services/api/invites.ts` types/hooks to consume the enriched payload (name/email/eligibility metadata).
- [X] T009 [US1] Update `client/src/pages/Admin/UserManagement/InvitedTab.tsx` (and related CSS if needed) to render the new columns and keep the Resend button visible for eligible rows.
- [X] T010 [P] [US1] Add Vitest/RTL coverage in `client/tests/pages/InvitedTab.test.tsx` asserting column rendering and button enablement logic.
- [X] T011 [US1] Refresh empty/loading states in `client/src/pages/Admin/UserManagement/InvitedTab.tsx` to mention that Resend only appears for eligible statuses per acceptance criteria.

### Parallel Execution Example – User Story 1

- Run T007 and T008 concurrently (independent code paths) before UI wiring.
- Execute T009 while T010 builds automated UI assertions.

**Checkpoint**: Admins can identify invitees and locate the Resend action without leaving the tab.

---

## Phase 4: User Story 2 - Resend invite with contextual modal (Priority: P2)

**Goal**: Provide a modal that surfaces live invite links, lifecycle metadata, copy control, and resend CTA mirroring original channels.

**Independent Test**: Trigger the modal for a seeded invite, copy the link, resend successfully (email-only and dual-channel cases), and see reminder counts update in place.

### Implementation for User Story 2

- [X] T012 [P] [US2] Implement `GET /api/admin/invites/:id/resend-context` in `server/src/controllers/admin/inviteController.ts` to fetch metadata + signed invite link, reusing policy helpers.
- [X] T013 [US2] Implement `POST /api/admin/invites/:id/resend` in the same controller/service to mirror original channels, increment reminder counts, and return updated metadata.
- [X] T014 [US2] Build `client/src/components/Admin/InviteResendModal.tsx` to display identity info, reminder metadata, guardrail copy, and action buttons.
- [X] T015 [P] [US2] Create reusable `client/src/components/UI/CopyableField.tsx` with always-visible invite URL + copy-to-clipboard feedback and associated tests in `client/tests/components/CopyableField.test.tsx`.
- [X] T016 [US2] Wire modal launch + mutations inside `client/src/pages/Admin/UserManagement/InvitedTab.tsx` and `client/src/hooks/useInviteResend.ts`, updating reminder counts only from server responses (no optimistic mutation) and invalidating/refetching queries when state changes.
- [X] T017 [P] [US2] Add backend integration tests in `server/tests/invites/inviteResend.spec.ts` covering GET + POST success/failure plus RBAC cases (401 unauthenticated, 403 member/staff, 200 admin).
- [X] T018 [P] [US2] Update `tests/e2e/full-flow.ts` with a Playwright scenario that opens the modal, copies the link, triggers resend, and validates the toast appears within 3 seconds.
- [X] T018a [US2] Instrument the Playwright scenario in `tests/e2e/full-flow.ts` (or a dedicated timing spec) to log total resend duration and fail if the measured interval exceeds the 3-second SLA defined in SC-002.

### Parallel Execution Example – User Story 2

- Backend tasks T012 and T013 can run concurrently with frontend component work (T014, T015).
- Automated tests T017 and T018 can start once respective server/client pieces are stubbed.

**Checkpoint**: Modal workflow delivers copy + resend functionality end-to-end.

---

## Phase 5: User Story 3 - Guardrails and audit trail (Priority: P3)

**Goal**: Enforce reminder caps, handle status changes mid-session, and log every resend attempt.

**Independent Test**: Simulate invites that are activated, revoked, or over cap; verify modal messaging, disabled actions, and audit records without affecting other stories.

### Implementation for User Story 3

- [X] T019 [US3] Enhance `server/src/services/inviteService.ts` + `server/src/utils/auditLogger.ts` to enforce reminder caps, detect status changes, persist `invite_reminders` records (source of truth), update invite summary columns transactionally, and emit audit events for every attempt (success or failure).
- [X] T020 [P] [US3] Instrument metrics/log redaction in `server/src/utils/auditLogger.ts` and monitoring config so invite URLs never appear in plaintext logs.
- [X] T021 [US3] Update `client/src/components/Admin/InviteResendModal.tsx` to show activation dates, cap-reached messaging, and disable resend/copy buttons when guardrails block the action.
- [X] T022 [P] [US3] Expand `client/tests/components/InviteResendModal.test.tsx` and negative Playwright paths to assert disabled states + messaging for activated/over-cap invites.
- [X] T023 [P] [US3] Implement auto-refresh logic in `client/src/hooks/useInviteResend.ts` to refetch invite detail when the backend signals state changes while the modal remains open (satisfies FR-008).

### Parallel Execution Example – User Story 3

- Backend guardrail logic (T019) can progress while observability work (T020) runs.
- Frontend messaging (T021) can be implemented concurrently with tests (T022) and refetch hook (T023).

**Checkpoint**: Guardrails prevent misuse and every resend action is auditable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation, monitoring, and regression work after user stories ship.

- [X] T024 Document the resend workflow, reminder cap policy, and troubleshooting tips in `specs/001-invite-resend-modal/quickstart.md` and `README.md` admin sections.
- [X] T025 [P] Configure monitoring/alerts for `invite_resend_total` and `invite_resend_failed` metrics plus log redaction validation inside `server/src/config/logger.ts` or equivalent observability pipeline.
- [X] T026 [P] Run full regression suite (`server/tests/**`, `client/tests/**`, `tests/e2e/full-flow.ts`) and record results in `specs/001-invite-resend-modal/research.md` or release notes.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 Setup** → unlocks schema/contract work.
- **Phase 2 Foundational** depends on Setup (env + contract stubs) and BLOCKS all user stories until migrations + shared helpers are ready.
- **Phase 3/4/5 User Stories** can proceed in priority order once Phase 2 completes; each story remains independently testable.
- **Phase 6 Polish** waits for desired user stories to ship.

### User Story Dependencies
- **US1 (P1)** depends only on Phase 2 completion; provides MVP.
- **US2 (P2)** depends on US1 payload changes (Invited tab columns) and shared helpers from Phase 2.
- **US3 (P3)** builds on US2 (modal + resend flow) to add guardrails/audits but can be developed in parallel once resend endpoints exist.

### Within-Story Flow
- For each story: backend contract/logic → client services → UI → tests.
- Test tasks marked [P] should be written once dependent components exist and must fail before fixes.

---

## Implementation Strategy

### MVP First (Deliver US1)
1. Complete Phases 1–2.  
2. Ship Phase 3 (US1) to expose identity data + resend entry point.  
3. Validate SC-001 (table accuracy) before extending functionality.

### Incremental Delivery
1. After MVP, deliver US2 to enable modal copy/resend workflow.  
2. US3 follows to add guardrails/audit without regressing earlier stories.  
3. Each stage can be demoed independently to stakeholders.

### Parallel Team Strategy
- Team A: Backend schema + services (T003–T006, T012–T013, T019).  
- Team B: Frontend table + modal work (T008–T016, T021).  
- Team C: Testing + observability (T010, T017–T018, T020, T022–T026).  
- Maintain coordination via OpenAPI contract updates (T006) to avoid drift.
