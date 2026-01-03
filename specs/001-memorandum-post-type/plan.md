# Implementation Plan: Memorandum Post Type

**Branch**: `001-memorandum-post-type` | **Date**: 2026-01-04 | **Spec**: specs/001-memorandum-post-type/spec.md
**Input**: Feature specification from specs/001-memorandum-post-type/spec.md

## Summary

Introduce a “Memorandum” post type that is always member-only: selecting Memorandum auto-sets visibility to Member and disables the visibility control; server-side enforces access consistently across list/detail APIs and returns 404 for unauthorized access. Backend-first changes include enum usage (`ContentType.MEMO`), service/controller enforcement, and admin UI wiring.

## Technical Context

- **Language/Version**: React 18 + TypeScript; Node.js + Express with TypeScript; Prisma; MySQL
- **Primary Dependencies**: react-router-dom, Prisma Client, JWT auth (existing), Vite
- **Storage**: MySQL via Prisma
- **Testing**: Existing e2e tests under tests/e2e; add unit/integration tests for content service and admin UI
- **Target Platform**: Web (frontend), Linux/MacOS dev for backend
- **Project Type**: Web app with `client/` (frontend) and `server/` (backend)
- **Performance Goals**: UI reaction to type selection within 1s; server list/detail p95 < 200ms under normal load
- **Constraints**: Server-side authorization must be authoritative; 404 for unauthorized Memorandum access; avoid schema migrations if possible
- **Scale/Scope**: MVP scope; low volume of content; pagination already in place

## Constitution Check

- **Backend Authority**: Pass — enforcement is server-side in services/controllers.
- **Visibility Rules**: Pass — Member-only enforced; Public only for guests.
- **Content Lifecycle**: Pass — uses existing `DRAFT/PUBLISHED/ARCHIVED`; no deletion.
- **Roles & Permissions**: Pass — Admin-only content management; members/guests read-only.
- **Authentication & Security**: Pass — JWT tokens, server checks; add rate limiting note.
- **Non-Functional**: Pass/Partial — pagination present; logging/observability to be reinforced in tasks.

## Project Structure

Documentation for this feature:

```text
specs/001-memorandum-post-type/
├── plan.md
├── spec.md
├── checklists/
└── (Phase outputs to be added: research.md, data-model.md, quickstart.md, contracts/)
```

Source layout (existing):

```text
server/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   └── app.ts
└── prisma/

client/
├── src/
│   ├── pages/
│   ├── components/
│   ├── context/
│   └── services/
```

**Structure Decision**: Keep current mono-repo with `client/` and `server/`, modifying content service/controller and admin posts page to support Memorandum behavior.

## Milestones & Phases

### Phase 0: Outline & Research (Short)
- Confirm UI label vs backend enum mapping: UI shows “Memorandum”; backend uses `ContentType.MEMO`. (Accepted)
- Confirm error semantics: 404 for unauthorized (guests and non-members). (Accepted)
- Identify any hidden dependencies: None; reuse existing visibility and auth flows.

Deliverable: research.md (concise decisions and rationale) — NEEDS CLARIFICATION only if future variations arise.

### Phase 1: Design & Contracts
- Data Model: No schema migration required (enum already has `MEMO`); document content fields and visibility interaction in data-model.md.
- API Contracts: No new endpoints; document behavior of `/api/content` list and `/api/content/:id` detail for Memorandum visibility in contracts/.
- Quickstart: Steps to create a Memorandum via admin UI and validate member-only behavior.

Deliverables: data-model.md, contracts/, quickstart.md.

### Phase 2: Implementation (Backend-first, then Frontend)

Backend (Server)
- Services: Update `getContentById()` and `listContent()` to explicitly enforce member-only for `MEMO` (already consistent, ensure tests cover `MEMO`).
- Controllers: Confirm controllers pass `userRole` and return 404 for unauthorized `MEMO` content.
- Routes: No changes; ensure `authenticate` present on `/content` and `/content/:id`.
- Security: Ensure rate limiting on content detail endpoint if needed (note in tasks), JWT handling intact.

Frontend (Client)
- Admin Posts Page: Update create/edit form to include “Memorandum” in Type control. When selected, auto-set visibility to Member and disable the visibility dropdown; show helper text.
- Post Detail Page: No changes required; relies on server enforcement.
- UX: Add disabled state styling and tooltip/note: “Memorandum posts are member-only.”

## Data Migration Strategy
- No schema migration; enum already includes `MEMO` in Prisma schema.
- Existing posts: When type is changed to `MEMO`, enforce visibility update to `MEMBER` server-side and persist; on revert, restore prior visibility (or default to PUBLIC).
- Add a one-off script (optional) to audit content table for any `MEMO` with incorrect visibility and fix (admin-only).

## Security-Critical Steps
- Authorization: Server-side checks in `contentService.getContentById()` and `listContent()` block guests for `MEMBER` visibility (includes `MEMO`).
- Error Semantics: Return 404 for unauthorized memorandum access to prevent enumeration.
- RBAC: Ensure only Admin can create/update content via `/admin/content` routes (already enforced).
- Rate Limiting: Consider minimal rate limiting on `/content/:id` to avoid brute-force enumeration; log denied attempts.
- Token Handling: Continue using Authorization header with JWT; do not store sensitive tokens in plaintext.

## Risks & Dependencies
- Risk: UI may not disable visibility consistently across all admin forms. Mitigation: unit/e2e tests for admin posts.
- Risk: Inconsistent client rendering for unauthorized `MEMO` content. Mitigation: rely on server 404 and show friendly message.
- Dependency: Existing auth middleware must populate `req.user.role` reliably.
- Dependency: Prisma models and enums must stay in sync; avoid schema changes.

## MVP vs Full Implementation
- **MVP (must-have)**:
  - Backend enforcement for `MEMO` (server-side visibility + 404).
  - Admin UI: type selection, auto visibility to Member, disabled control, helper text.
  - Basic tests: service unit tests and admin UI behavior.
- **Stubs/Deferred**:
  - Rate limiting rules tuning.
  - Observability (structured logs for denied accesses) — add in tasks.
  - Audit script for legacy content.

## Phase Outputs
- Phase 0: research.md — decisions documented.
- Phase 1: data-model.md, contracts/, quickstart.md — updated.
- Phase 2: Implementation plan ready for `/speckit.tasks`.

## Next Steps
- Run `/speckit.tasks` to enumerate actionable tasks from this plan.
