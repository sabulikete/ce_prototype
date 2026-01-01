---
description: "Task list for Member Portal Platform MVP"
---

# Tasks: Member Portal Platform MVP

**Input**: Design documents from `/specs/001-platform-mvp/`
**Prerequisites**: plan.md, spec.md, requirements.md, architecture.md, data-model.md, api.md

**Organization**: Tasks are grouped by implementation phase as defined in the plan, prioritizing backend foundation before frontend implementation.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel
- **[Story]**: User Story ID (e.g., US-PUB-1)
- **[ID]**: Sequential Task ID (T001, T002...)

## Phase 1: Foundation & Backend Core

**Purpose**: Establish the database schema, API contract, and core business logic (Auth, Content, Events, Billing) before UI development.

- [x] T001 Define Prisma schema with User, Content, Event, Ticket, BillingStatement models in `server/prisma/schema.prisma`
- [x] T002 Run Prisma migration to initialize MySQL database and generate client in `server/prisma/migrations`
- [x] T003 Complete `openapi.yaml` to cover all endpoints defined in `api.md` in `specs/001-platform-mvp/contracts/openapi.yaml`
- [x] T004 Implement RBAC middleware for Member/Admin/Staff + unauthenticated guest handling in `server/src/middleware/auth.ts`
- [x] T005 Implement User service and Invite generation/validation logic in `server/src/services/userService.ts`
- [x] T006 Implement Auth endpoints (Login, Forgot/Reset) and Invite endpoints (Create, Validate, Accept) in `server/src/controllers/authController.ts`
- [x] T007 Implement Content and Event services with CRUD and visibility logic in `server/src/services/contentService.ts`
    - Acceptance: Pinned sorting applies only to published; member/public queries exclude draft/archived; admin can view all states.
- [x] T008 Implement Content endpoints (Public/Member/Admin) in `server/src/controllers/contentController.ts`
    - Acceptance: Pinned sorting applies only to published; member/public queries exclude draft/archived; admin can view all states.
- [x] T009 Implement QR signing service (HMAC-SHA256) and Ticket service in `server/src/services/qrService.ts`
- [x] T010 Implement Ticket endpoints (Issue, Void) and Atomic Check-in with scan window validation in `server/src/controllers/ticketController.ts`
    - Acceptance: Void fails if checked_in_at is set. Check-in fails if voided_at is set.
- [x] T011 Implement Billing service with Single Upload and Bulk ZIP pipeline (Extract, Parse Filenames, Results) in `server/src/services/billingService.ts`
    - Acceptance: Accept DEC-2025 3C-201.pdf format. Reject non-matching files and include them in failures list (REQ-BLK-02a behavior).
- [x] T012 Implement Billing endpoints (List, Download, Upload, Bulk Upload) in `server/src/controllers/billingController.ts`
- [x] T013 Implement GET /health and basic structured logging (request id, method, path, status, duration) in `server/src/app.ts`

## Phase 2: Frontend - Public & Member

**Purpose**: Implement public-facing and member-facing UI flows.

- [x] T014 [P] [US-PUB-1] Create Public Landing Page with Content List and Filters in `client/src/pages/LandingPage.tsx`
- [x] T015 [P] [US-PUB-2] Create Content Detail View for Public Announcements in `client/src/pages/PostDetail.tsx`
- [x] T016 [P] [US-MEM-1] Create Login Page and Password Reset Flow in `client/src/pages/Login.tsx`
- [x] T017 [US-MEM-1] Create Member Dashboard with Recent Content in `client/src/pages/Dashboard.tsx`
- [x] T018 [US-MEM-3] Create My Tickets View with QR Code Display in `client/src/components/Events/MyTickets.tsx`
- [x] T019 [US-MEM-2] Create My Billing View with Statement List and Download in `client/src/pages/Billing.tsx`

## Phase 3: Frontend - Admin & Staff

**Purpose**: Implement administrative and operational tools.

- [x] T020 [P] [US-ADM-1] Create Admin Content Management UI (CRUD, Pin, Publish) in `client/src/pages/Admin/AdminPosts.tsx`
- [x] T021 [P] [US-ADM-2] Create Admin User Management UI with Invite Generation in `client/src/pages/Admin/AdminUsers.tsx`
- [x] T022 [P] [US-ADM-3] Create Admin Event Management UI with Ticket Issuance in `client/src/pages/Admin/AdminEvents.tsx`
- [x] T023 [P] [US-ADM-4] Create Admin Billing UI with Bulk Upload and Report Display in `client/src/pages/Admin/AdminBilling.tsx`
- [x] T024 [US-STF-1] Create Staff Scanner UI with Camera Integration and Validation Feedback in `client/src/pages/Scanner.tsx`

## Phase 4: Integration & Polish

**Purpose**: Verify system integrity, security, and readiness for deployment.

- [x] T025 Implement Rate Limiting for Login and Check-in endpoints in `server/src/middleware/rateLimit.ts`
- [x] T026 Perform End-to-End Test: Invite -> Login -> View Content -> Get Ticket -> Scan in `tests/e2e/full-flow.spec.ts`
- [x] T027 Verify Security: RBAC checks on all endpoints and Token handling in `server/src/routes`
- [x] T028 Prepare Dockerfile and Seed Data for Deployment in `server/Dockerfile` and `server/prisma/seed.ts`
