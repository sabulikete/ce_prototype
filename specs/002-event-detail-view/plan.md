# Implementation Plan: Event Detail View

**Branch**: `002-event-detail-view` | **Date**: 2026-01-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-event-detail-view/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The Event Detail View enhances the admin events dashboard by making events clickable, navigating to a dedicated detail page that displays comprehensive event information, ticket statistics broken down by status, and a paginated attendee table. Admins can issue tickets directly from this page using a searchable multi-select dropdown that includes invited users. The implementation prioritizes simplicity with manual refresh for data updates and server-side data processing for search and pagination.

## Technical Context

**Language/Version**: TypeScript (Node.js v20+), React 18
**Primary Dependencies**: Express, Prisma ORM, React Router, Lucide-React
**Storage**: MySQL (via Prisma Client)
**Testing**: Manual Testing (Independent Tests defined in Spec)
**Target Platform**: Web (Modern Browsers)
**Project Type**: Web application (Client + Server)
**Performance Goals**: Page load < 2s, Attendee search < 1s, Supports up to 200 attendees
**Constraints**: Mobile-responsive design for admin panel, manual refresh pattern (no real-time updates)
**Scale/Scope**: Pagination at 20 items/page, searchable dropdown for user selection

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Backend Authority**: PASSED. Event detail data, ticket statistics, attendee aggregation, search, and pagination are server-side operations (FR-006, FR-011).
- **Spec-Driven Development**: PASSED. Specification created and clarified before implementation.
- **Product Intent**: PASSED. Aligns with "Administrative content management" and "Event management with QR-based entry validation".
- **Roles & Permissions**: PASSED. Admin-only access enforced (FR-009). Issue tickets maintains "Tickets are issued only by administrators" principle.
- **User Lifecycle**: PASSED. Supports issuing tickets to invited users who haven't activated accounts (FR-012), aligned with invite-based user model.
- **Data Integrity and Auditability**: PASSED. Uses existing ticket and event models with audit timestamps.
- **Technology Constraints**: PASSED. Uses React with TypeScript for frontend, Node.js with Express and TypeScript for backend, MySQL via Prisma.

## Project Structure

### Documentation (this feature)

```text
specs/002-event-detail-view/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
├── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
└── checklists/
    └── requirements.md  # Quality validation checklist
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── controllers/
│   │   └── eventController.ts   # [UPDATE] Add getEventDetail, getEventAttendees endpoints
│   ├── routes/
│   │   └── eventRoutes.ts       # [UPDATE] Add detail page endpoints
│   └── models/                  # [REF] Event, Ticket, User models via Prisma
└── package.json

client/
├── src/
│   ├── pages/
│   │   └── Admin/
│   │       ├── AdminEvents.tsx      # [UPDATE] Make event list clickable
│   │       └── EventDetail.tsx      # [NEW] Event detail page component
│   ├── components/
│   │   └── Events/
│   │       ├── EventInfo.tsx        # [NEW] Event details display
│   │       ├── TicketStats.tsx      # [NEW] Mini dashboard with status breakdown
│   │       ├── AttendeeTable.tsx    # [NEW] Paginated attendee table with search
│   │       └── IssueTicketsModal.tsx # [UPDATE] Add searchable multi-select dropdown
│   └── services/
│       └── api.ts               # [UPDATE] Add eventDetail, attendees API calls
└── package.json
```

**Structure Decision**: Web application structure (Client/Server split) matching existing project organization.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All requirements align with constitutional principles.

---

# Phase 0: Outline & Research

## Research Tasks

### R1: Attendee Data Aggregation Strategy

**Research Goal**: Determine efficient approach for aggregating tickets per user (one row per user with ticket count and status summary).

**Key Questions**:
- How to efficiently query and group tickets by user in Prisma with MySQL?
- What's the performance impact of aggregation vs client-side grouping for up to 200 attendees?
- How to handle status aggregation display (e.g., "2 Issued, 1 Checked In")?

**Expected Outcome**: SQL/Prisma query pattern for ticket aggregation, performance benchmark, decision on server vs client aggregation.

---

### R2: React Router State Preservation Patterns

**Research Goal**: Identify best practice for preserving dashboard filters/page while refreshing data on back navigation.

**Key Questions**:
- How to preserve query parameters (search, filter, page) when navigating to detail page?
- Best approach: URL state, React Router location state, or context?
- How to trigger data refresh while maintaining navigation state?

**Expected Outcome**: Implementation pattern for state preservation with data refresh, code examples.

---

### R3: Searchable Multi-Select Component Options

**Research Goal**: Find suitable searchable multi-select dropdown component for React that supports filtering and displays user activation status.

**Key Questions**:
- Which React multi-select libraries are compatible with TypeScript and current dependencies?
- How to display user status indicators (Invited vs Active) in dropdown?
- Performance considerations for 100+ users in dropdown?

**Expected Outcome**: Recommended component library or custom implementation approach, integration examples.

---

### R4: Pagination with Search UX Patterns

**Research Goal**: Define user experience when search is applied with pagination (reset to page 1, preserve page, etc.).

**Key Questions**:
- Should search reset pagination to page 1?
- How to indicate "filtered results" vs "all results" in pagination controls?
- Best practice for empty search results UX?

**Expected Outcome**: UX specification for search + pagination interaction, mockup of states.

---

## Research Output

**Deliverable**: `research.md` documenting findings for R1-R4 with:
- Decision: What approach was chosen
- Rationale: Why chosen over alternatives
- Alternatives considered: What else was evaluated
- Code examples or query patterns where applicable

---

# Phase 1: Design & Contracts

*Prerequisites: research.md complete*

## Data Model (`data-model.md`)

### Entities

**Event** (existing model via Prisma)
- Fields: id, title, startDate, endDate, location, description, status
- Relationships: Has many Tickets
- Notes: No schema changes required

**Ticket** (existing model via Prisma)
- Fields: id, code_hash, eventId, userId, status (Issued/Checked In/Voided), createdAt
- Relationships: Belongs to Event, Belongs to User
- Notes: No schema changes required

**User/Attendee** (existing model via Prisma)
- Fields: id, email, role, status (ACTIVE/INVITED)
- Relationships: Has many Tickets
- Notes: INVITED status indicates user invited but not yet activated

**Ticket Statistics** (computed aggregate)
- Fields: totalIssued, countByStatus { issued, checkedIn, voided }
- Source: Aggregated from Ticket model
- Notes: Computed on-demand, not persisted

**Attendee View** (computed aggregate for table display)
- Fields: userId, userName, userEmail, ticketCount, firstTicketId, statusSummary
- Source: JOIN tickets with users, GROUP BY userId
- Notes: One row per user with ticket aggregates

### State Transitions

No new state transitions. Uses existing ticket status flow:
- Issued → Checked In (via scanner)
- Issued → Voided (via admin action)
- Checked In → [terminal state] (cannot void after check-in)

### Validation Rules

- Event detail page accessible only to ADMIN role users
- Ticket issuance allowed to users with status ACTIVE or INVITED
- Pagination triggers at >20 attendees
- Search filters attendees by name (case-insensitive, partial match)

---

## API Contracts (`contracts/`)

### GET /api/events/:eventId

**Description**: Fetch event detail with ticket statistics

**Auth**: Required (ADMIN role)

**Path Parameters**:
- `eventId` (integer): Event ID

**Response** (200 OK):
```json
{
  "id": 1,
  "title": "Annual Gala",
  "startDate": "2026-02-15T18:00:00Z",
  "endDate": "2026-02-15T23:00:00Z",
  "location": "Grand Hall",
  "description": "Annual fundraising event",
  "status": "PUBLISHED",
  "ticketStats": {
    "total": 45,
    "byStatus": {
      "issued": 30,
      "checkedIn": 12,
      "voided": 3
    }
  }
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden (non-admin)
- 404: Event not found

---

### GET /api/events/:eventId/attendees

**Description**: Fetch paginated attendee list with aggregated ticket info

**Auth**: Required (ADMIN role)

**Path Parameters**:
- `eventId` (integer): Event ID

**Query Parameters**:
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20): Items per page
- `search` (string, optional): Filter by user name (case-insensitive)

**Response** (200 OK):
```json
{
  "attendees": [
    {
      "userId": 5,
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "ticketCount": 2,
      "firstTicketId": "ABC12345",
      "statusSummary": "2 Issued"
    },
    {
      "userId": 8,
      "userName": "Jane Smith",
      "userEmail": "jane@example.com",
      "ticketCount": 3,
      "firstTicketId": "XYZ67890",
      "statusSummary": "2 Checked In, 1 Issued"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden (non-admin)
- 404: Event not found

---

### GET /api/users/selectable

**Description**: Fetch all users (active and invited) for ticket issuance dropdown

**Auth**: Required (ADMIN role)

**Query Parameters**:
- `search` (string, optional): Filter by name or email

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": 5,
      "name": "John Doe",
      "email": "john@example.com",
      "status": "ACTIVE"
    },
    {
      "id": 12,
      "name": "New Member",
      "email": "new@example.com",
      "status": "INVITED"
    }
  ]
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden (non-admin)

---

## Quickstart Guide (`quickstart.md`)

### Developer Setup

1. **Prerequisites**: Node.js v20+, MySQL running, existing project dependencies installed

2. **Database**: No schema changes required (uses existing Event, Ticket, User models)

3. **Backend Development**:
   ```bash
   cd server
   npm run dev  # Starts server on port 3000
   ```

4. **Frontend Development**:
   ```bash
   cd client
   npm run dev  # Starts Vite dev server
   ```

### Testing the Feature

**Manual Test 1 - View Event Details (P1)**:
1. Navigate to Admin Events Dashboard
2. Click any event in the list
3. Verify navigation to `/admin/events/:id`
4. Confirm page displays:
   - Mini dashboard with ticket stats (total, by status)
   - Event details (title, dates, location, description)
   - Attendee table (if tickets exist)

**Manual Test 2 - Attendee Table with Search**:
1. On event detail page with >5 attendees
2. Use search field to filter by name
3. Verify table updates to show matching results
4. Clear search, verify full list returns
5. Navigate through pages if >20 attendees

**Manual Test 3 - Issue Tickets (P2)**:
1. Click "Issue Tickets" button
2. Verify modal opens with searchable dropdown
3. Type to filter users, select multiple users (including invited)
4. Submit ticket issuance
5. Refresh page manually (F5)
6. Verify attendee table updated with new tickets
7. Verify mini dashboard stats increased

**Manual Test 4 - Navigation Preservation (P3)**:
1. On dashboard, apply search filter and navigate to page 2
2. Click an event to view detail
3. Click back button (or back navigation element)
4. Verify return to page 2 with search filter preserved
5. Verify event list shows current data (not stale cache)

---

# Phase 2: Implementation Plan (Generated by `/speckit.tasks`)

**NOTE**: This section is NOT filled by `/speckit.plan`. Run `/speckit.tasks` after completing Phase 0 and Phase 1 to generate the task breakdown.

The `/speckit.tasks` command will create `tasks.md` with:
- Task breakdown organized by phases
- Dependencies between tasks
- Estimated complexity
- Acceptance criteria per task
- Link back to user stories in spec.md

---

# Post-Design Constitution Re-Check

*Run after Phase 1 design complete*

- **Backend Authority**: ✅ PASSED. Event detail endpoint, attendee aggregation, ticket statistics, and user selection all use server-side logic. No client-side business rules.
- **Spec-Driven Development**: ✅ PASSED. All endpoints and components traced to functional requirements in spec.md.
- **Simplicity and Restraint**: ✅ PASSED. Manual refresh pattern avoids WebSocket complexity. Server-side aggregation chosen for correctness over premature optimization. Reuses existing ticket issuance workflow.
- **Data Integrity and Auditability**: ✅ PASSED. No new models, uses existing audit timestamps on Ticket model.
- **Roles & Permissions**: ✅ PASSED. Admin-only endpoints with authentication middleware.
- **User Lifecycle**: ✅ PASSED. Ticket issuance supports INVITED users, tickets become visible upon activation (existing behavior).

**Result**: All gates passed. Ready to proceed to Phase 2 (`/speckit.tasks`).

---

**Next Steps**:
1. Review and validate `research.md` (Phase 0)
2. Review and validate `data-model.md`, `contracts/`, `quickstart.md` (Phase 1)
3. Run `/speckit.tasks` to generate task breakdown in `tasks.md`
4. Begin implementation following task phases
