# Implementation Plan: Member Portal Platform MVP

**Branch**: `001-platform-mvp` | **Date**: 2026-01-04  
**Specs Consulted**: [overview.md](overview.md), [requirements.md](requirements.md), [architecture.md](architecture.md), [data-model.md](data-model.md), [api.md](api.md)

## Summary
- Deliver a production-ready MVP that unifies public content, member experiences, admin operations, QR-based events, and secure billing.  
- Respect backend authority: every rule (visibility, RBAC, ticketing, billing) is enforced server-side with Prisma-managed MySQL schemas.  
- Sequence work backend-first to stabilize APIs/contracts before building React clients.  
- Integrate constitution mandates (content lifecycle, QR security, billing isolation) into milestones to unblock `/speckit.tasks` scoping.

## Technical Context
- **Languages**: TypeScript end-to-end (React 18 client, Node 20 Express backend).  
- **Frameworks/Libraries**: Vite, React Router, React Query (data fetching), Express, Prisma, Zod/Joi validation, bcrypt, jsonwebtoken.  
- **Persistence**: MySQL 8 via Prisma migrations; object/PDF storage abstracted (local FS for MVP with interface to swap to S3).  
- **Testing**: Vitest + React Testing Library + Supertest for API integration; Playwright for E2E smoke prior to release.  
- **Tooling**: Docker Compose for local dev (app + MySQL), pm2 or similar for prod process management, ESLint/Prettier already configured.  
- **External Dependencies**: Transactional email (e.g., SendGrid/Mailgun) for invites/resets, minimal SMS gateway optional (stubbed for MVP).

## Constitution Check (Gate)
- Backend is single source of truth: all modules expose REST endpoints with RBAC middleware; clients do not gate behavior.  
- Unified content model (announcement/activity/memo/event) with lifecycle and pinning is preserved in schema + APIs.  
- Events honor signed QR payloads, atomic check-in, staff-only scanner windows.  
- Billing visibility window + member isolation enforced via SQL queries scoped by `user_id` and `period`.  
- Roles limited to Guest (implicit), Member, Admin, Staff with backend enforcement.  
- Tech stack (React/Node/MySQL) unchanged.  
**Result**: Pass – no conflicts detected; violations must be escalated before implementation.

## Phased Delivery & Milestones (Backend-first)

### Phase 0 – Platform Infrastructure & Schema Baseline *(Milestone M0: "Ready to scaffold")*
1. Create `.env` contracts, Docker Compose stack (api, db, storage mock) and seed secrets (JWT signing, QR signing, encryption keys).  
2. Translate [data-model.md](data-model.md) into Prisma schema: `User`, `Invite`, `Content`, `Event`, `Ticket`, `BillingStatement`, plus audit timestamps.  
3. Generate initial Prisma migration + seed script (bootstrap super-admin, demo member, sample content).  
4. Wire CI checks (lint, test, prisma format, migration diff) and health-check endpoint.  
5. Produce OpenAPI skeleton covering endpoints from [api.md](api.md) to lock contracts before coding.  
**Exit Criteria**: Migrations apply cleanly to blank DB; API server boots with health endpoint; OpenAPI draft committed.

### Phase 1 – Identity, Auth, and RBAC Services *(Milestone M1: "Secure Access")*
1. Implement Invite lifecycle: create/revoke invites, hashed tokens, expiry enforcement, acceptance flow provisioning member credentials + unit linkage.  
2. Build Auth module: login (JWT issuance), refresh policy (short-lived access tokens), forgot/reset password with token hashing, bcrypt storage.  
3. Add RBAC middleware + decorators for `admin`, `staff`, `member`, `guest`, including unit tests for route protection.  
4. Implement rate limiting per [api.md](api.md) (login 5/min/IP, check-in 60/min/staff) using middleware (e.g., Redis store or in-memory with leaky bucket for MVP).  
5. Establish audit logging hooks for invite actions, login attempts, and password resets (persist to `audit_log` table or structured logs).  
**Exit Criteria**: All identity/auth endpoints pass integration tests; unauthorized access attempts blocked with correct HTTP codes; audit logs emitted.

### Phase 2 – Core Backend Domain APIs *(Milestone M2: "API Complete")*
**Content & Events**  
6. Implement Content CRUD (admin scope) with lifecycle transitions, pinning, and visibility filters for public/member queries.  
7. Extend Content with Event metadata (start/end/location) and enforce archive-over-delete policy.  

**Tickets & QR**  
8. Ticket issuance service: batch assign to members, void-before-check-in, store hashed QR token references.  
9. QR generation: signed JWT payload {ticketId,eventId, jti}; implement verification + idempotent check-in transaction (SELECT ... FOR UPDATE).  
10. Staff check-in endpoint enforcing scanning window (start-3h → end+3h) with audit trail and reason codes for failures.

**Billing & Bulk Upload**  
11. Single upload endpoint: validate PDF mimetype, restrict to admins, store metadata + file path, enforce member visibility window.  
12. Bulk upload pipeline: zip extraction, filename parser (`MMM-YYYY BuildingCluster-Unit.pdf`), per-file transaction, partial failure reporting, dedupe policy (replace).  
13. Storage abstraction to swap FS/S3; ensure files cleaned up on failures.  

**Exit Criteria**: OpenAPI updated, Postman suite verifies all endpoints, background jobs (if any) scheduled, logging/metrics for each critical flow (content publish, ticket issue, bulk upload).

### Phase 3 – Public & Member Experience *(Milestone M3: "Member Ready")*
14. Frontend routing shell (React Router): public marketing pages, auth pages, member app shell with protected routes from AuthContext.  
15. Public site: content listing with filters, detail view, pinned ordering, CTA for login on member-only items.  
16. Member dashboard: aggregated content feed, my tickets (render QR tokens via `<canvas>`), billing table with download actions (respecting window).  
17. Password reset + invite acceptance flows (web forms) wired to Phase 1 APIs with success/failure toasts, thorough form validation.  
**Exit Criteria**: Member persona can log in, view content, download statements, and present QR code from UI using stubbed data toggled off.

### Phase 4 – Admin & Staff Consoles *(Milestone M4: "Operational Control")*
18. Admin content workspace: create/edit forms honoring lifecycle, preview mode, pin toggles, search/pagination.  
19. User management: invite list with resend/revoke (ties into existing invite APIs), status filters.  
20. Billing console: single upload form, bulk upload wizard with drag/drop, result reporting (success/failure table).  
21. Ticket issuance UI + staff scanner view (mobile optimized) with live validation responses (success, already checked in, invalid).  
22. Role-based navigation to hide admin/staff surfaces from members/guests.  
**Exit Criteria**: Admin can manage content/events/billing end-to-end via UI; staff scanning flow tested on mobile Safari/Chrome.

### Phase 5 – Hardening, Observability, Launch *(Milestone M5: "Launch Candidate")*
23. Automated testing: seed scenarios for invite→login→view content→ticket issue→scan, plus bulk upload regression.  
24. Performance tuning: ensure QR validation < 500ms P95 (indexing, caching of public content) and bulk upload completes 500 files without timeout via streaming processing.  
25. Security review: JWT secret rotation plan, audit logs export, verify rate limits, dependency vulnerability scan.  
26. Deployment: finalize Dockerfiles, Compose/Helm manifests, runbook for environmental variables, backup/restore drill for MySQL + storage.  
27. Documentation: update `quickstart.md`, admin runbooks, staff scanning SOP, billing upload guide.  
**Exit Criteria**: All success criteria in [requirements.md](requirements.md) satisfied; sign-off for real-world pilot.

## Data Migration & Seeding Strategy
1. **Baseline Migration**: Use Prisma migrate to create tables per [data-model.md](data-model.md) with enums for roles, content types, content status, visibility, plus invite + audit tables.  
2. **Derived Tables**: Implement event table as extension of content via FK; ensure cascades respect archive semantics (no hard deletes).  
3. **Ticket State**: Add unique index `(event_id, user_id, code_hash)` to prevent duplicates; `checked_in_at` column default NULL for atomic updates.  
4. **Billing Statements**: Store `period` as first-of-month DATE; enforce `(user_id, period)` uniqueness for replace-on-duplicate semantics.  
5. **Seeds**: Create migration-time seed script (non-production) for super-admin, sample member/unit, demo event/tickets, and sample billing PDFs.  
6. **Future Changes**: Document migration ordering (invite/user before ticket/billing) and require data backfill scripts (e.g., convert legacy statements) to run via Prisma `seed.ts`.  
7. **Rollback Plan**: Maintain migration checkpoints; for destructive changes prefer new columns + backfill before dropping old ones to preserve auditability.

## Security-Critical Workstreams
- JWT & QR signing keys managed via env secrets, rotated per release; tokens stored only as hashes when persistence is required (invites/reset).  
- RBAC middleware enforced on every route using declarative policy map; integration tests assert 403/401 for unauthorized roles.  
- Rate limits applied to auth + check-in per [api.md](api.md); use Redis/In-memory adapter with exponential backoff on login.  
- File uploads scanned for MIME and size; PDFs stored outside web root with signed URL download endpoints to prevent direct access.  
- All database writes (invites, ticket issuance, check-ins, bulk uploads) emit audit events to `audit_log` table for later review.  
- Sensitive configs (SMTP creds, storage keys) pulled from secrets manager; `.env.example` documents required values.  
- Enforce HTTPS in production with secure cookies for optional refresh tokens; same-site and CSRF tokens for forms (especially invite acceptance + reset).

## Dependencies, Risks, and MVP Stubs
- **External Dependencies**: Email service (blocking for invites/resets), storage backend (local FS acceptable for MVP but needs abstraction), camera access (staff scanner relies on modern browsers).  
- **Risks**: Bulk upload ZIPs may be large—stream extraction and enforce per-file size limits; QR scanning demand may spike—ensure DB indexes on `ticket.id` and `ticket.event_id`; billing PDFs contain PII—log access minimally and secure storage path.  
- **Stubs vs Full**: SMS delivery optional/stubbed (email primary); analytics dashboards deferred—provide basic logs only; push notifications and in-app messaging explicitly out of scope; advanced role customization limited to fixed roles defined in constitution.  
- **Open Dependencies**: Need confirmation on storage location (local vs S3) before Phase 2, and SMTP provider credentials before Phase 1 testing.  
- **Mitigations**: Use feature flags for staff scanner + billing bulk upload to isolate issues; add background job retries for failed ticket email notifications.  

## Ready for `/speckit.tasks`
Each phase above yields a discrete milestone with clear exit criteria, enabling `/speckit.tasks` to break work into actionable tickets (backend-first), attach security gates, and trace data migration deliverables without reinterpreting specs.

