---

description: "Implementation tasks for Memorandum Post Type"
---

# Tasks: Memorandum Post Type

**Input**: Design documents from specs/001-memorandum-post-type/
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align client UI with backend enums and prepare UI controls.

- [X] T001 [P] Update type enum usage and labels in client/src/pages/Admin/AdminPosts.tsx
  - Goal: Replace `POST` with `MEMO` and display label "Memorandum" in type options, filters, and badges.
  - Files: [client/src/pages/Admin/AdminPosts.tsx](client/src/pages/Admin/AdminPosts.tsx), [client/src/pages/Admin/AdminPosts.css](client/src/pages/Admin/AdminPosts.css)
  - Acceptance: Type select shows "Memorandum"; filter button toggles to MEMO; table badges render MEMO; no references to `POST` remain in UI.
  - Dependencies: None.

- [X] T002 [P] Add helper note styling for visibility rules in client/src/pages/Admin/AdminPosts.css
  - Goal: Provide a clear note style near visibility control indicating "Memorandum posts are member-only".
  - Files: [client/src/pages/Admin/AdminPosts.css](client/src/pages/Admin/AdminPosts.css)
  - Acceptance: Note text renders with muted style; consistent spacing and readability next to visibility select.
  - Dependencies: T001.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm backend enforcement and wire 404 semantics; blocks user stories.

- [X] T003 Ensure server-side 404 behavior for unauthorized memorandum access in server/src/services/contentService.ts
  - Goal: Confirm `getContentById()` returns `null` for unauthorized member-only content so controllers send 404.
  - Files: [server/src/services/contentService.ts](server/src/services/contentService.ts), [server/src/controllers/contentController.ts](server/src/controllers/contentController.ts)
  - Acceptance: Guest/non-member fetching MEMO with `visibility=MEMBER` results in 404 via controller; admin/member receives content.
  - Dependencies: None.

- [X] T004 [P] Verify list filtering excludes member-only memorandum for guests in server/src/services/contentService.ts
  - Goal: Confirm `listContent()` restricts guests to `visibility=PUBLIC`, thereby excluding MEMO marked MEMBER.
  - Files: [server/src/services/contentService.ts](server/src/services/contentService.ts)
  - Acceptance: Guest list for type MEMO returns only PUBLIC items; member/admin lists include MEMBER items according to role.
  - Dependencies: None.

- [X] T005 [P] Ensure auth middleware passes `req.user.role` to content controllers in server/src/routes/content.ts
  - Goal: Confirm `authenticate` sets `req.user.role` for controllers to enforce visibility (already present; verify wiring).
  - Files: [server/src/routes/content.ts](server/src/routes/content.ts)
  - Acceptance: Requests include role context; controllers read `req.user.role` and behave per role.
  - Dependencies: None.

**Checkpoint**: Foundation ready — proceed to user stories.

---

## Phase 3: User Story 1 - Select Memorandum Type (Priority: P1)

**Goal**: Selecting "Memorandum" auto-sets visibility to Member and disables the visibility control.

- [X] T006 [US1] Auto-set visibility to MEMBER when type=MEMO in client/src/pages/Admin/AdminPosts.tsx
  - Goal: Immediately set `formData.visibility='MEMBER'` upon selecting MEMO.
  - Files: [client/src/pages/Admin/AdminPosts.tsx](client/src/pages/Admin/AdminPosts.tsx)
  - Acceptance: Changing type to Memorandum updates visibility to Member Only without extra clicks.
  - Dependencies: T001.

- [X] T007 [US1] Disable visibility select when type=MEMO in client/src/pages/Admin/AdminPosts.tsx
  - Goal: Make visibility select read-only (disabled) when Memorandum is selected.
  - Files: [client/src/pages/Admin/AdminPosts.tsx](client/src/pages/Admin/AdminPosts.tsx)
  - Acceptance: Visibility dropdown is disabled for Memorandum; enabled for other types.
  - Dependencies: T006.

- [X] T008 [US1] Show inline note: "Memorandum posts are member-only" in client/src/pages/Admin/AdminPosts.tsx
  - Goal: Display informative note near visibility control when type=MEMO.
  - Files: [client/src/pages/Admin/AdminPosts.tsx](client/src/pages/Admin/AdminPosts.tsx), [client/src/pages/Admin/AdminPosts.css](client/src/pages/Admin/AdminPosts.css)
  - Acceptance: Note appears only when type=MEMO and uses the helper style from T002.
  - Dependencies: T002, T007.

- [X] T009 [US1] Ensure payload uses `type: 'MEMO'` and `visibility: 'MEMBER'` in client/src/pages/Admin/AdminPosts.tsx
  - Goal: `createContent`/`updateContent` payloads include correct enum values for Memorandum.
  - Files: [client/src/pages/Admin/AdminPosts.tsx](client/src/pages/Admin/AdminPosts.tsx), [client/src/services/api.ts](client/src/services/api.ts)
  - Acceptance: Submitting a Memorandum creates/updates content with `type=MEMO`, `visibility=MEMBER`.
  - Dependencies: T006, T007.

- [X] T010 [P] [US1] Update filter button and fetch to use MEMO in client/src/pages/Admin/AdminPosts.tsx
  - Goal: Replace "Posts" filter with "Memorandum" and pass `type=MEMO` to `fetchContent`.
  - Files: [client/src/pages/Admin/AdminPosts.tsx](client/src/pages/Admin/AdminPosts.tsx)
  - Acceptance: Clicking "Memorandum" filter loads only MEMO items.
  - Dependencies: T001.

**Checkpoint**: User Story 1 delivers UI enforcement and correct payloads.

---

## Phase 4: User Story 2 - Update Existing Posts (Priority: P2)

**Goal**: Changing type to Memorandum enforces Member visibility immediately; reverting restores prior visibility.

- [X] T011 [US2] Enforce visibility lock on edit for existing MEMO in client/src/pages/Admin/AdminPosts.tsx
  - Goal: When editing a MEMO, visibility select remains disabled and set to MEMBER.
  - Files: [client/src/pages/Admin/AdminPosts.tsx](client/src/pages/Admin/AdminPosts.tsx)
  - Acceptance: Editing existing MEMO shows disabled visibility control set to Member Only.
  - Dependencies: T007.

- [X] T012 [US2] Implement revert behavior from MEMO to other types (restore previous or default PUBLIC) in client/src/pages/Admin/AdminPosts.tsx
  - Goal: Re-enable visibility select when type changes from MEMO to non-MEMO; restore previous non-MEMO visibility or default PUBLIC.
  - Files: [client/src/pages/Admin/AdminPosts.tsx](client/src/pages/Admin/AdminPosts.tsx)
  - Acceptance: Switching away from Memorandum re-enables visibility and shows last non-MEMO selection or PUBLIC.
  - Dependencies: T006, T007.

- [X] T013 [US2] Persist visibility changes on type transitions via updateContent in client/src/services/api.ts
  - Goal: Ensure `updateContent` receives visibility per new type rules and persists correctly.
  - Files: [client/src/services/api.ts](client/src/services/api.ts)
  - Acceptance: Updating a post’s type to MEMO persists visibility=MEMBER; reverting persists chosen visibility.
  - Dependencies: T012.

**Checkpoint**: User Story 2 ensures legacy content respects new rules.

---

## Phase 5: User Story 3 - Audience Enforcement (Priority: P3)

**Goal**: Guests cannot view memorandum content; members and admins can.

- [X] T014 [US3] Confirm `/api/content/:id` returns 404 for unauthorized memorandum access in server/src/controllers/contentController.ts
  - Goal: Validate controller behavior to return 404 when service returns null for unauthorized MEMO.
  - Files: [server/src/controllers/contentController.ts](server/src/controllers/contentController.ts)
  - Acceptance: Guest request for MEMO detail receives 404; member/admin receives 200 with content.
  - Dependencies: T003.

- [X] T015 [P] [US3] Confirm `/api/content` list honors role visibility for MEMO in server/src/services/contentService.ts
  - Goal: Validate list behavior restricts guests to PUBLIC; members/admins see appropriate items.
  - Files: [server/src/services/contentService.ts](server/src/services/contentService.ts)
  - Acceptance: Guest list excludes MEMBER MEMO; member list includes MEMBER MEMO; admin list includes all.
  - Dependencies: T004.

**Checkpoint**: User Story 3 enforces audience-level access rules.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: UX clarity and operational safeguards.

- [X] T016 [P] Add tooltip/aria note for disabled visibility control in client/src/pages/Admin/AdminPosts.tsx
  - Goal: Improve accessibility and inform admins why the control is disabled.
  - Files: [client/src/pages/Admin/AdminPosts.tsx](client/src/pages/Admin/AdminPosts.tsx), [client/src/pages/Admin/AdminPosts.css](client/src/pages/Admin/AdminPosts.css)
  - Acceptance: Tooltip/aria-label present; meets basic accessibility expectations.
  - Dependencies: T008.

- [X] T017 [P] Document quick steps for creating a Memorandum in specs/001-memorandum-post-type/quickstart.md
  - Goal: Provide a short admin-facing guide to create and verify Memorandum behavior.
  - Files: [specs/001-memorandum-post-type/quickstart.md](specs/001-memorandum-post-type/quickstart.md)
  - Acceptance: Quickstart includes create, edit, and view notes aligned with spec.
  - Dependencies: Phase 3 completion.

---

## Dependencies & Execution Order

- Setup (Phase 1): T001 → T002
- Foundational (Phase 2): T003, T004, T005 (can run in parallel except controller/service cross-check on T003)
- User Story 1 (P1): T006 → T007 → T008; T009; T010 (parallel with T006 once T001 done)
- User Story 2 (P2): T011 → T012 → T013
- User Story 3 (P3): T014 (depends on T003) and T015 (depends on T004)
- Polish: T016 (after US1), T017 (after US1/US2/US3 core behaviors)

## Parallel Execution Examples

- Phase 2: T004 and T005 can run in parallel while T003 is verified.
- US1: T010 (filter wiring) can proceed in parallel with T006 once enum mapping (T001) is in place.
- Polish: T016 and T017 can run in parallel after US1 acceptance.

## Implementation Strategy

- MVP First: Complete Phase 1 + Phase 2, then Phase 3 (US1). This delivers UI enforcement and correct payloads.
- Incremental Delivery: Add US2 (legacy transition handling), then US3 (audience enforcement confirmation), finish with polish.
