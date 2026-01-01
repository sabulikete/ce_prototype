# Implementation Plan: Member Portal Platform MVP

**Branch**: `001-platform-mvp` | **Date**: 2026-01-01 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-platform-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The Member Portal Platform MVP delivers a unified system for public information, member-only content, event ticketing with QR validation, and secure billing statement distribution. The technical approach leverages a React/Node.js/MySQL stack with strict backend authority for security. Key components include a public website, authenticated member portal, admin dashboard, and a staff scanning interface.

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend & Backend)
**Primary Dependencies**: React 18, Node.js 20 (LTS), Express, Prisma ORM, JWT, bcrypt.
**Storage**: MySQL 8.0+
**Testing**: Vitest (Unit/Integration)
**Target Platform**: Web (Browser) + Node.js Server (Dockerized)
**Project Type**: Web application (Monorepo-style structure: client/server)
**Performance Goals**: QR Validation < 500ms; Bulk upload 500 files completes reliably without timeout.
**Constraints**: MVP scope; Backend Authority; Local filesystem for PDF storage (abstracted).
**Scale/Scope**: 5,000 members; ~10k content items.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Backend Authority**: Plan enforces server-side validation for all ops.
- **Spec-Driven**: All code follows `specs/001-platform-mvp/`.
- **Simplicity**: Using standard REST, local storage for PDFs, and CSS Modules.
- **Content Governance**: Unified content model implemented.
- **Events/QR**: Signed QR codes, atomic check-in, staff-only scanning.
- **Billing**: Strict isolation, rolling window visibility.
- **Roles**: RBAC middleware for Guest, Member, Admin, Staff.
- **Tech Constraints**: React, Node, MySQL used.

## Project Structure

### Documentation (this feature)

```text
specs/001-platform-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── openapi.yaml
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── config/          # Env, DB connection
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, RBAC, Validation
│   ├── models/          # Prisma schema (replaces existing models/)
│   ├── routes/          # API definitions
│   ├── services/        # Business logic (Billing, QR, Content)
│   ├── utils/           # Helpers (PDF parsing, Crypto)
│   └── app.ts           # App entry
└── prisma/
    └── schema.prisma    # Database schema

client/
├── src/
│   ├── components/      # Shared UI
│   ├── context/         # AuthContext
│   ├── hooks/           # API hooks
│   ├── pages/           # Route views (Public, Member, Admin)
│   ├── services/        # API client
│   └── types/           # TS interfaces
```

**Structure Decision**: Standard Client/Server split. Adopting Prisma for `server/` to replace raw models, requiring a migration strategy.

## Implementation Phases

### Phase 1: Foundation & Backend Core
1.  **Setup**: Initialize Prisma, configure MySQL connection, setup `server` structure.
2.  **API Contract**: Complete `openapi.yaml` to cover all endpoints defined in `api.md`.
3.  **Auth & Users**: Implement User/Invite models, Login/Invite endpoints, RBAC middleware.
4.  **Content Module**: Implement Content/Event models, CRUD endpoints, Public/Member visibility logic.
4.  **Events & QR**: Implement Ticket model, Issue/Void logic, QR signing service, Check-in endpoint (atomic).
5.  **Billing Core**: Implement BillingStatement model, Upload (Single/Bulk) logic, Filename parsing, Visibility window.

### Phase 2: Frontend - Public & Member
1.  **Public Site**: Landing page, Content list (filtered), Content detail.
2.  **Auth UI**: Login page, Password reset flow.
3.  **Member Portal**: Dashboard, My Tickets (display QR), My Billing (list/download).

### Phase 3: Frontend - Admin & Staff
1.  **Admin Dashboard**: Content management (CRUD, Pin, Publish), User management (Invite list).
2.  **Billing Ops**: Bulk upload UI, Upload report display.
3.  **Staff Scanner**: Mobile-optimized scan page, Camera integration, Validation feedback UI.

### Phase 4: Integration & Polish
1.  **End-to-End Testing**: Verify critical flows (Invite -> Login -> View Content -> Get Ticket -> Scan).
2.  **Security Audit**: Review RBAC on all endpoints, Rate limiting check.
3.  **Deployment Prep**: Dockerfile updates, Seed data for demo.

## Complexity Tracking

N/A - No constitution violations.


| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
