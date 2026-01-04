# Implementation Plan: Invite Resend Modal

**Branch**: `001-invite-resend-modal` | **Date**: 2026-01-04  
**Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-invite-resend-modal/spec.md`

## Summary
- Surface full invitee identity data (name, email, inviter, status, reminder metadata) directly within the Invited tab rows so admins have context before acting.  
- Provide an always-visible Resend Invite action for reminder-eligible statuses that launches a modal containing the live invitation URL, metadata, guardrail messaging, and copy/resend controls.  
- Implement resend behavior that mirrors the original delivery channels, enforces reminder caps (default 3), blocks actions on activated/revoked invites, and logs every attempt for compliance per FR-006/FR-007.  
- Guarantee immediate UX feedback: copy confirmation toast, resend confirmation within 3 seconds of mail provider acknowledgement, and state refresh when invite status changes while the modal is open.

## Technical Context
- **Language/Version**: TypeScript 5.x on React frontend and Node.js 20 (Express) backend.  
- **Primary Dependencies**: React 18, Vite, React Router, React Query, Context/Zustand; Express, Prisma ORM, Zod validation, jsonwebtoken, bcrypt, Nodemailer or SendGrid SDK.  
- **Storage**: MySQL 8 via Prisma models (`users`, `invites`, new `invite_reminders` table) plus existing audit log tables.  
- **Testing**: Vitest + React Testing Library for UI; Playwright smoke for table→modal→resend; Supertest + Prisma test harness for resend API; contract tests to keep OpenAPI spec in sync.  
- **Target Platform**: Browser-based admin console backed by Dockerized Node API services.  
- **Project Type**: Web application with `client/` (React) and `server/` (Express) packages.  
- **Performance Goals**: Invited tab renders <1.5s for 500 invitees; modal open <300ms; resend API completes (including mail provider 202) in ≤3s per FR-005; audit logging adds <50ms overhead.  
- **Constraints**: Backend authority only; reminder policy cannot be bypassed; invite links must never escape authenticated context; clipboard flow reuses existing Toast UX.  
- **Scale/Scope**: Impacts admin Invited tab, invite service, and audit logging; reuses existing infra but must remain compatible with future bulk invite work.

## Constitution Check
*Gate satisfied – no violations identified.*
- **Backend Authority**: Eligibility, cap enforcement, channel mirroring, and audit logging handled entirely server-side via new resend service.  
- **Auditability**: Each resend attempt writes to immutable audit + invite reminder tables, fulfilling transparency requirements.  
- **Security**: Modal fetches live invite link via authenticated request; link stored transiently, copy control uses existing secure patterns; rate limit ensures no spam.  
- **Role Enforcement**: Only admins can access resend endpoints/UI; middleware uses existing RBAC.  
- **Tech Stack Compliance**: Remains within mandated React/Express/MySQL ecosystem.

## Project Structure

### Documentation Assets
```text
specs/001-invite-resend-modal/
├── spec.md
├── plan.md
├── research.md
├── data-model.md          # populate if new tables/columns required
├── quickstart.md          # implementation notes post-build
├── contracts/
│   └── openapi-invite-resend.yaml
└── checklists/
    └── requirements.md   # Spec Quality Checklist
```

### Source Code Touchpoints
```text
server/
├── src/
│   ├── controllers/admin/inviteController.ts
│   ├── services/inviteService.ts
│   ├── routes/admin/inviteRoutes.ts
│   ├── middleware/authz.ts
│   ├── utils/auditLogger.ts
│   ├── prisma/schema.prisma          # add invite_reminders + new columns
│   └── config/invites.ts             # reminder cap + channel policy
└── tests/
    ├── invites/inviteResend.spec.ts
    └── contracts/openapi-invites.spec.ts

client/
├── src/
│   ├── pages/Admin/UserManagement/InvitedTab.tsx
│   ├── components/Admin/InviteResendModal.tsx
│   ├── components/UI/CopyableField.tsx
│   ├── services/api/invites.ts
│   ├── context/ToastContext.tsx
│   └── hooks/useInviteResend.ts
└── tests/
    ├── pages/InvitedTab.test.tsx
    └── components/InviteResendModal.test.tsx
```

**Structure Decision**: Web application split (existing `client/` + `server/` directories). All changes fit into the paths listed above; no new top-level packages are introduced.

## Phase Outputs
- **Contracts**: Extend OpenAPI spec with `GET /api/admin/invites/:id/resend-context` (returns reminder metadata + live link token specifically for the modal) and `POST /api/admin/invites/:id/resend` (mirror original channels, well-defined error codes).  
- **Data Model**: Add `invite_reminders` table as the source of truth for resend history, plus cached `last_sent_at`, `reminder_count`, `last_sent_by` fields on `Invites` that are updated transactionally for fast table rendering; document migration + seed updates in `data-model.md`.  
- **Tests**: Backend unit/integration coverage for eligibility checks, cap enforcement, channel mirroring, audit logging; frontend tests for table rendering, modal UX, toast flows; Playwright E2E path (table → modal → resend) plus a timing assertion to validate the ≤3s SLA for SC-002.  
- **UI Components**: Invited tab table columns, `InviteResendModal`, `CopyableField`, loading/error states, and toast integration.  
- **Ops**: Audit metrics (`invite_resend_total`, `invite_resend_failed`), log redaction rules for invite links, and CI contract tests ensuring API stays aligned with OpenAPI file.

## Operational Clarifications
- **Reminder Cap Source**: Configured via `INVITE_REMINDER_CAP` constant (default 3) in `server/src/config/invites.ts`, overridable via env; stored alongside policy metadata and referenced in OpenAPI + UI copy.  
- **Mailer Confirmation Definition**: The 3-second UX guarantee measures from resend button click to receiving a 2xx/202 acknowledgement from the transactional email/SMS provider; once acknowledged, UI displays success even if downstream delivery is async.  
- **Requirements File Note**: Formal FRs reside in [spec.md](spec.md). The file at `checklists/requirements.md` is a readiness checklist, not a second requirements source.

## Complexity Tracking
_No constitutional exceptions or justifications required._
