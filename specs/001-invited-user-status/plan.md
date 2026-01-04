# Implementation Plan: Invited Users Status Visibility

**Branch**: `[001-invited-user-status]` | **Date**: January 4, 2026 | **Spec**: [specs/001-invited-user-status/spec.md](specs/001-invited-user-status/spec.md)
**Input**: Feature specification from `/specs/001-invited-user-status/spec.md`

## Summary

Expose invited users directly inside the admin user-management page by defaulting to an **Invited** tab, surfacing lifecycle metadata (sent date, inviter, reminder count, expiration), enforcing invitation deduplication, and keeping statuses authoritative on the backend. Deliverables include updated Prisma schema + migrations, admin APIs that return a union of `User` and `Invite` data, tabbed UI in React (refresh-driven updates), and secure actions to resend or revoke invitations.

## Technical Context

**Language/Version**: Backend Node.js 20.x with TypeScript 5.9; Frontend React 18.3 (Vite)  
**Primary Dependencies**: Express 5, Prisma 5, JWT auth middleware, React Router 6, React Query/local data hooks  
**Storage**: MySQL via Prisma ORM (Invite + User tables)  
**Testing**: Manual QA checklist for MVP; automated Jest + Supertest / Vitest suites deferred to a later release  
**Target Platform**: Web (Vite dev server) + Node API running on Linux containers  
**Project Type**: Web application with discrete `server/` (API) and `client/` (SPA) projects  
**Performance Goals**: Admin list refresh under 3 seconds for ≤5k records; invite status change propagation ≤5 minutes (per success criteria)  
**Constraints**: Must enforce backend RBAC, keep rate limiting on admin endpoints, avoid sending invite data to non-admin roles, and rely on manual page refreshes (no background polling) for admins to pull the latest lifecycle states  
**Scale/Scope**: Thousands of member records + invitations; table pagination already required by Constitution

## Constitution Check

| Principle | Impact | Status |
| --- | --- | --- |
| Backend Authority | All invite statuses computed + persisted server-side; frontend only renders DTOs returned by `/api/admin/users`. | ✅ Pass |
| Roles & Permissions | Only Admin/Super Admin may access invite metadata; endpoints behind JWT auth + role checks. | ✅ Pass |
| Data Integrity & Auditability | Prisma migration adds timestamps/fields; resend/revoke actions logged. | ✅ Pass |
| Non-Functional Requirements | API remains paginated, uses rate limiting, and logs actions. | ✅ Pass |

*Re-evaluated after Phase 1 design artifacts (research/data-model/contracts) — no violations detected. Complexity tracking not required.*

## Project Structure

### Documentation (this feature)

```text
specs/001-invited-user-status/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-users.yaml
└── checklists/
    └── requirements.md
```

### Source Code

```text
server/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.ts
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── middleware/
└── scripts/

client/
├── src/
│   ├── pages/
│   │   └── Admin/UserManagement
│   ├── components/
│   ├── context/
│   └── services/api.ts
└── tests/
```

**Structure Decision**: Existing two-project web stack retained; feature touches `server/prisma`, `server/src/{routes,controllers,services}`, and `client/src/pages/Admin` plus shared table components.

## Build Phases & Milestones

### Phase 0 – Research & Alignment *(Complete)*
- Captured design decisions in [research.md](specs/001-invited-user-status/research.md): schema extensions, union API strategy, frontend tab UX, and security posture.
- No blocking open questions; testing stack details remain marked **NEEDS CLARIFICATION** for later confirmation.

### Phase 1 – Data Modeling, Contracts, and Migration Prep *(Backend-first)*
**Milestone 1: Schema Updates**
- Update `prisma/schema.prisma` with `InviteStatus` enum, `status`, `revoked_at`, `reminder_count`, `last_sent_at` fields.
- Generate Prisma migration + SQL review; draft backfill script that sets initial statuses (Pending/Expired/Accepted) and default `last_sent_at`.
- Add unique invite constraints / resolution strategy (per-email pending invite) and supporting fields for conflict flags so duplicates can be surfaced in the UI.
- Document migration + rollback steps in repo (align with Non-Functional requirements for DB governance).

**Milestone 2: API Contracts & DTOs**
- Finalize DTO defined in [contracts/admin-users.yaml](specs/001-invited-user-status/contracts/admin-users.yaml).
- Design Prisma query/service combining `User` + `Invite` data with pagination + filtering (search, `view` query param), including deduplication logic that collapses duplicate-pending invites per email and surfaces conflict flags.
- Define resend & revoke endpoints with validation + audit logging, ensuring rate limiter covers mutation routes.

**Milestone 3: Security Review**
- Ensure JWT middleware restricts new routes to admin roles; add integration tests (or stubs) once test harness clarified.
- Confirm invitation data never leaks to member/guest routes; document in controller-level comments.

### Phase 2 – Backend Implementation & Tests
**Milestone 4: Service + Controller Logic**
- Implement service functions: `listUserManagementRows`, `resendInvite`, `revokeInvite` leveraging updated schema.
- Add domain validations (max reminders, cannot revoke accepted invite, reinstate flows) and audit logs.
- Wire Express routes + controllers; reuse rate limiter middleware for resend/revoke actions.

**Milestone 5: Testing & Observability**
- Produce a detailed manual QA checklist (covering invited tab default, resend/revoke flows, RBAC) and execute during release validation.
- Document gaps where automated coverage is deferred; log structured resend/revoke events plus metric counters (stub metrics if telemetry stack absent).

### Phase 3 – Frontend UX & State (Post-backend)
**Milestone 6: Tabbed UI + Data Fetching**
- Update admin user-management page to add tab control defaulting to Invited; integrate with data hook hitting `/api/admin/users?view=...`.
- Display invitation metadata columns (sent date, inviter, reminders, expiration) plus conflict badges (duplicate emails, linked deactivated users). Show placeholders for missing full names.

**Milestone 7: Actions & Feedback**
- Add "Resend" and "Revoke" actions within Invited tab rows; surface toast notifications using existing Toast context.
- Handle optimistic UI carefully—prefer refetch after mutation to avoid divergence from backend authority.
- Ensure loading/empty/error states per tab are covered (skeleton + helpful copy).

### Phase 4 – Integration, Security Hardening, Release
**Milestone 8: E2E Validation & Docs**
- Run `tests/e2e/full-flow.ts` (update as needed) to ensure invited users appear by default and transitions display correctly.
- Update admin training/README plus [quickstart.md](specs/001-invited-user-status/quickstart.md); include migration + deployment checklist.
- Monitor logs post-release for resend/revoke anomalies; add alert thresholds if reminder_count spikes.

## Data Migration Strategy
- Migration defined in [data-model.md](specs/001-invited-user-status/data-model.md) Milestone 1.
- Steps: generate Prisma migration, run in staging, execute backfill script (using Prisma client) to set `status`, `last_sent_at`, `reminder_count`, `revoked_at = null`.
- Deploy with feature-flagged API (return invites only after migration complete) to avoid null metadata on frontend.
- Include rollback plan: revert code, run `prisma migrate reset --force` in non-prod, or craft SQL to drop new columns if prod hotfix required.

## Security-Critical Tasks
- Enforce admin-only access on `/api/admin/users` and invite mutation endpoints; ensure middleware returns 403 for staff/member roles.
- Keep rate limiting (existing express-rate-limit) on listing/resend endpoints to mitigate scraping/spam.
- Hash invite tokens as today; never expose tokens in responses. Continue to store only `token_hash`.
- Log resend/revoke actions with `actorId`, `inviteId`, `previousStatus`, `newStatus`, and request ID for audit trails.

## Risks & Dependencies
- **Testing debt**: Automated backend/frontend tests deferred; ensure manual QA checklist is version-controlled and consider fast-follow task to add Jest/Vitest suites.
- **Email delivery coupling**: Resend flow assumes existing mailer; if absent, stub handler must return success while logging TODO (communicate limitation in release notes).
- **Manual refresh reliance**: Because admins must refresh to see lifecycle changes, documentation and training must highlight this to avoid stale views being misinterpreted.
- **Multiple “001-” spec directories**: tooling warnings require clean-up before future automation (track separately).

## Stub vs. Full Implementation
- **Full**: Prisma schema, admin list endpoint, resend/revoke controllers, frontend tab UI, invitation metadata display.
- **Stub Allowed**: Email resend integration (if mailer unavailable) may log and simulate success but must still update `reminder_count` + `last_sent_at`. Metrics hooks can log JSON until observability stack defined.

## Complexity Tracking

Not applicable—no Constitution violations introduced.
