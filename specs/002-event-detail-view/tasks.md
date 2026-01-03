# Tasks: Event Detail View

**Feature Branch**: `002-event-detail-view`  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)  
**Status**: Ready for Implementation

---

## Phase 1: Setup
*Goal: Initialize project structure, add database indexes, and define interfaces.*

- [X] T001 Add composite database index on Ticket(eventId, userId, status) in server/prisma/schema.prisma
  - **Files**: `server/prisma/schema.prisma`
  - **Goal**: Optimize attendee aggregation queries for performance
  - **Acceptance**: 
    - Index `@@index([eventId, userId, status])` added to Ticket model
    - Run `npx prisma migrate dev --name add_ticket_composite_index`
    - Verify index exists in database
  - **Dependencies**: None

- [X] T002 Install react-select dependency for multi-select dropdown
  - **Files**: `client/package.json`
  - **Goal**: Add searchable multi-select component library
  - **Acceptance**:
    - Run `npm install react-select @types/react-select` in client directory
    - Verify packages appear in package.json and package-lock.json
    - No build errors when starting dev server
  - **Dependencies**: None

- [X] T003 Create EventDetail page component skeleton in client/src/pages/Admin/EventDetail.tsx
  - **Files**: `client/src/pages/Admin/EventDetail.tsx`
  - **Goal**: Set up basic page structure with routing
  - **Acceptance**:
    - Component created with TypeScript
    - Extracts eventId from URL params using useParams()
    - Renders placeholder text "Event Detail Page - ID: {eventId}"
    - Exports default EventDetail component
  - **Dependencies**: None

- [X] T004 Add route for event detail page in client/src/App.jsx
  - **Files**: `client/src/App.jsx`
  - **Goal**: Register /admin/events/:id route
  - **Acceptance**:
    - Route added: `<Route path="/admin/events/:id" element={<EventDetail />} />`
    - Import EventDetail component
    - Protected by authentication (within ProtectedRoute wrapper)
    - Can navigate to /admin/events/1 and see placeholder
  - **Dependencies**: T003

---

## Phase 2: Foundational Backend
*Goal: Implement core backend endpoints and aggregation logic.*

- [X] T005 Implement getEventDetail controller function in server/src/controllers/eventController.ts
  - **Files**: `server/src/controllers/eventController.ts`
  - **Goal**: Fetch event data with ticket statistics
  - **Acceptance**:
    - Function accepts eventId from request params
    - Queries Event model using Prisma
    - Aggregates Ticket counts grouped by status
    - Returns event object with ticketStats: { total, byStatus: { issued, checkedIn, voided } }
    - Returns 404 if event not found
    - Returns 500 on database errors
  - **Dependencies**: T001

- [X] T006 Implement getEventAttendees controller function in server/src/controllers/eventController.ts
  - **Files**: `server/src/controllers/eventController.ts`
  - **Goal**: Fetch paginated attendee list with ticket aggregates
  - **Acceptance**:
    - Function accepts eventId, page, limit, search from request
    - Validates page >= 1, limit = 20
    - Aggregates tickets by userId (groupBy)
    - Applies search filter on user email/unit_id if provided
    - Fetches user details for matched userIds
    - Computes status summary per user (e.g., "2 Issued, 1 Checked In")
    - Returns { attendees: [], pagination: { page, limit, total, totalPages } }
    - Returns 404 if event not found
  - **Dependencies**: T001, T005

- [X] T007 Implement getSelectableUsers controller function in server/src/controllers/userController.ts
  - **Files**: `server/src/controllers/userController.ts`
  - **Goal**: Fetch users available for ticket issuance
  - **Acceptance**:
    - Function accepts optional search query param
    - Queries User model where status IN ('ACTIVE', 'INVITED')
    - Applies search filter on email/unit_id if provided
    - Returns { users: [{ id, name, email, status }] }
    - Sorts by name (unit_id) or email alphabetically
  - **Dependencies**: None

- [X] T008 Register GET /api/events/:eventId route in server/src/routes/eventRoutes.ts
  - **Files**: `server/src/routes/eventRoutes.ts`
  - **Goal**: Connect event detail endpoint
  - **Acceptance**:
    - Route: `router.get('/events/:eventId', authenticateToken, requireAdmin, getEventDetail)`
    - Imports getEventDetail from eventController
    - Returns event data when called with valid JWT + admin role
    - Returns 401 without auth, 403 for non-admin
  - **Dependencies**: T005

- [X] T009 Register GET /api/events/:eventId/attendees route in server/src/routes/eventRoutes.ts
  - **Files**: `server/src/routes/eventRoutes.ts`
  - **Goal**: Connect attendee list endpoint
  - **Acceptance**:
    - Route: `router.get('/events/:eventId/attendees', authenticateToken, requireAdmin, getEventAttendees)`
    - Imports getEventAttendees from eventController
    - Accepts query params: page, limit, search
    - Returns paginated attendee data
  - **Dependencies**: T006

- [X] T010 Register GET /api/users/selectable route in server/src/routes/userRoutes.ts
  - **Files**: `server/src/routes/userRoutes.ts`
  - **Goal**: Connect user selection endpoint
  - **Acceptance**:
    - Route: `router.get('/users/selectable', authenticateToken, requireAdmin, getSelectableUsers)`
    - Imports getSelectableUsers from userController
    - Accepts optional search query param
    - Returns user list for dropdown
  - **Dependencies**: T007

---

## Phase 3: User Story 1 - View Event Details (P1)
*Goal: Admin can click event from dashboard and view detailed information with ticket statistics.*

- [X] T011 [P] [US1] Create EventInfo component in client/src/components/Events/EventInfo.tsx
  - **Files**: `client/src/components/Events/EventInfo.tsx`
  - **Goal**: Display event details section
  - **Acceptance**:
    - Component accepts event prop with { title, startDate, endDate, location, description, status }
    - Renders event title as heading
    - Formats dates using date formatter
    - Displays location and description
    - Shows status badge (Published/Draft/Archived)
    - Handles null/optional fields gracefully
  - **Dependencies**: None

- [X] T012 [P] [US1] Create TicketStats component in client/src/components/Events/TicketStats.tsx
  - **Files**: `client/src/components/Events/TicketStats.tsx`
  - **Goal**: Display mini dashboard with ticket statistics
  - **Acceptance**:
    - Component accepts ticketStats prop with { total, byStatus: { issued, checkedIn, voided } }
    - Renders 4 stat cards: Total, Issued, Checked In, Voided
    - Uses card layout similar to EventMetrics component
    - Shows zero values if no tickets
    - Uses icons from lucide-react
  - **Dependencies**: None

- [X] T013 [US1] Create AttendeeTable component skeleton in client/src/components/Events/AttendeeTable.tsx
  - **Files**: `client/src/components/Events/AttendeeTable.tsx`
  - **Goal**: Set up attendee table structure with pagination
  - **Acceptance**:
    - Component accepts eventId prop
    - State for: attendees, pagination, search, currentPage
    - Table with columns: Name, Email, Ticket Count, Ticket ID, Status
    - Empty state: "No tickets issued yet"
    - Search input field (not yet functional)
    - Pagination controls (not yet functional)
  - **Dependencies**: None

- [X] T014 [US1] Add API methods for event detail endpoints in client/src/services/api.ts
  - **Files**: `client/src/services/api.ts`
  - **Goal**: Create API client functions
  - **Acceptance**:
    - Add getEventDetail(eventId): Promise<Event>
    - Add getEventAttendees(eventId, params): Promise<{ attendees, pagination }>
    - Add getSelectableUsers(search?): Promise<{ users }>
    - All methods include JWT token in Authorization header
    - Proper error handling with try/catch
  - **Dependencies**: T008, T009, T010

- [X] T015 [US1] Implement EventDetail page with data fetching in client/src/pages/Admin/EventDetail.tsx
  - **Files**: `client/src/pages/Admin/EventDetail.tsx`
  - **Goal**: Connect backend data to page components
  - **Acceptance**:
    - Fetches event detail on mount using getEventDetail()
    - Renders EventInfo component with event data
    - Renders TicketStats component with ticketStats data
    - Renders AttendeeTable component with eventId
    - Shows loading state while fetching
    - Shows error state if fetch fails with retry button
    - Back button to return to dashboard
  - **Dependencies**: T005, T008, T011, T012, T013, T014

- [X] T016 [US1] Make event list clickable in client/src/pages/Admin/AdminEvents.tsx
  - **Files**: `client/src/pages/Admin/AdminEvents.tsx`, `client/src/components/Events/EventList.tsx`
  - **Goal**: Add click handler to navigate to detail page
  - **Acceptance**:
    - EventList receives onEventClick prop
    - Each table row has onClick handler
    - Clicking row navigates to /admin/events/:id
    - Preserves current dashboard state in location.state.returnTo
    - Row has cursor-pointer style
    - Hover effect on row
  - **Dependencies**: T003, T004, T015

---

## Phase 4: User Story 1 - Attendee Table Features
*Goal: Implement search and pagination for attendee table.*

- [X] T017 [US1] Implement attendee data fetching in AttendeeTable component
  - **Files**: `client/src/components/Events/AttendeeTable.tsx`
  - **Goal**: Load attendee data from API
  - **Acceptance**:
    - useEffect fetches attendees when eventId, page, or search changes
    - Calls getEventAttendees(eventId, { page, limit: 20, search })
    - Updates attendees state with response data
    - Updates pagination state with metadata
    - Shows loading skeleton while fetching
    - Shows error if fetch fails
  - **Dependencies**: T013, T014

- [X] T018 [US1] Implement search functionality in AttendeeTable component
  - **Files**: `client/src/components/Events/AttendeeTable.tsx`
  - **Goal**: Filter attendees by name/email
  - **Acceptance**:
    - Search input connected to state
    - Debounced search (300ms delay) using useEffect
    - Resets to page 1 when search changes
    - Shows "Showing X result(s) for 'query'" message
    - Empty result shows "No attendees found matching 'query'"
    - Clear button clears search
  - **Dependencies**: T017

- [X] T019 [US1] Implement pagination controls in AttendeeTable component
  - **Files**: `client/src/components/Events/AttendeeTable.tsx`
  - **Goal**: Navigate through pages of attendees
  - **Acceptance**:
    - Previous/Next buttons change currentPage state
    - Buttons disabled appropriately (prev on page 1, next on last page)
    - Shows "Page X of Y" indicator
    - Page change triggers data refetch
    - Preserves search query when changing pages
  - **Dependencies**: T017

---

## Phase 5: User Story 2 - Issue Tickets from Detail Page (P2)
*Goal: Admin can issue tickets using searchable multi-select dropdown.*

- [X] T020 [US2] Create IssueTicketsModal component with react-select in client/src/components/Events/IssueTicketsModal.tsx
  - **Files**: `client/src/components/Events/IssueTicketsModal.tsx`
  - **Goal**: Modal for issuing tickets with user selection
  - **Acceptance**:
    - Modal component with open/close props
    - react-select dropdown with isMulti enabled
    - Custom formatOptionLabel showing user name, email, status indicator
    - Status shown as "(Active)" or "(Invited)" badge
    - Search filters dropdown options
    - closeMenuOnSelect={false} allows multiple selections
    - Submit button disabled if no users selected
    - Cancel button closes modal
  - **Dependencies**: T002, T014

- [X] T021 [US2] Implement user loading in IssueTicketsModal
  - **Files**: `client/src/components/Events/IssueTicketsModal.tsx`
  - **Goal**: Fetch selectable users for dropdown
  - **Acceptance**:
    - useEffect fetches users when modal opens
    - Calls getSelectableUsers() API
    - Transforms users to react-select options format: { value: id, label: name, email, status }
    - Shows loading state in dropdown while fetching
    - Shows error if fetch fails
    - Supports client-side filtering via react-select search
  - **Dependencies**: T020, T014

- [X] T022 [US2] Add "Issue Tickets" button to EventDetail page
  - **Files**: `client/src/pages/Admin/EventDetail.tsx`
  - **Goal**: Trigger ticket issuance modal
  - **Acceptance**:
    - Button placed prominently near top of page
    - Opens IssueTicketsModal when clicked
    - Passes eventId to modal
    - Modal state (open/closed) managed in EventDetail
    - Button uses primary/accent styling
  - **Dependencies**: T020

- [X] T023 [US2] Implement ticket issuance submission in IssueTicketsModal
  - **Files**: `client/src/components/Events/IssueTicketsModal.tsx`
  - **Goal**: Submit selected users for ticket creation
  - **Acceptance**:
    - Submit button calls API: POST /api/tickets/bulk { eventId, userIds }
    - Extracts userIds from selected options
    - Shows loading state during submission
    - Shows success toast notification on success
    - Shows error toast on failure
    - Closes modal after successful submission
    - Note: Page data NOT auto-refreshed (per spec clarification)
  - **Dependencies**: T021, T022

---

## Phase 6: User Story 3 - Navigation Preservation (P3)
*Goal: Ensure dashboard state preserved when navigating back from detail page.*

- [X] T024 [US3] Implement back navigation in EventDetail page
  - **Files**: `client/src/pages/Admin/EventDetail.tsx`
  - **Goal**: Return to dashboard with preserved state
  - **Acceptance**:
    - Back button/link added to page header
    - Uses useNavigate() and useLocation() hooks
    - Reads location.state.returnTo from navigation state
    - navigate(returnTo) returns to exact dashboard URL with query params
    - Fallback to '/admin/events' if returnTo not set
    - Uses browser-standard back icon
  - **Dependencies**: T015

- [X] T025 [US3] Verify dashboard refresh on return navigation
  - **Files**: `client/src/pages/Admin/AdminEvents.tsx`
  - **Goal**: Ensure data refreshes while preserving filters
  - **Acceptance**:
    - useEffect dependency array includes searchParams
    - Component re-fetches data when mounted from back navigation
    - URL query params preserved (page, search, filter)
    - Dashboard shows current data, not stale cache
    - Verify by: issue tickets → back → see updated counts
  - **Dependencies**: T024

---

## Phase 7: Polish & Cross-Cutting
*Goal: Ensure good UX with loading states, error handling, and edge cases.*

- [X] T026 Add loading skeleton to EventDetail page
  - **Files**: `client/src/pages/Admin/EventDetail.tsx`
  - **Goal**: Show loading state during data fetch
  - **Acceptance**:
    - Skeleton placeholder for event info section
    - Skeleton placeholder for ticket stats cards
    - Skeleton placeholder for attendee table
    - Uses consistent skeleton styling with rest of app
    - Loading state shows immediately on mount
  - **Dependencies**: T015

- [X] T027 Add error handling to EventDetail page
  - **Files**: `client/src/pages/Admin/EventDetail.tsx`
  - **Goal**: Handle API errors gracefully
  - **Acceptance**:
    - Catches 404 error: "Event not found" message with link to dashboard
    - Catches 403/401 error: "Access denied" message
    - Catches 500/network error: "Failed to load event" with retry button
    - Retry button refetches data
    - Error displayed in user-friendly format
  - **Dependencies**: T015

- [X] T028 Add loading and error states to AttendeeTable
  - **Files**: `client/src/components/Events/AttendeeTable.tsx`
  - **Goal**: Handle attendee fetch states
  - **Acceptance**:
    - Loading skeleton shown while fetching attendees
    - Error message if attendee fetch fails
    - Retry button on error
    - Empty state: "No tickets issued yet" when attendees.length === 0 and no search
    - Search empty state: "No attendees found matching '{query}'"
  - **Dependencies**: T017

- [X] T029 Add loading and error states to IssueTicketsModal
  - **Files**: `client/src/components/Events/IssueTicketsModal.tsx`
  - **Goal**: Handle user loading and submission errors
  - **Acceptance**:
    - Dropdown shows "Loading users..." while fetching
    - Error alert if user fetch fails
    - Submit button shows spinner during submission
    - Toast notification on success: "Tickets issued successfully"
    - Toast notification on error with error message
    - Modal remains open on error, closes on success
  - **Dependencies**: T023

- [X] T030 Add responsive styling to EventDetail page
  - **Files**: `client/src/pages/Admin/EventDetail.tsx`, `client/src/components/Events/*.tsx`
  - **Goal**: Ensure mobile-responsive layout
  - **Acceptance**:
    - Ticket stats cards stack vertically on mobile (<768px)
    - Attendee table horizontally scrollable on mobile
    - Search field and pagination responsive
    - Back button visible and accessible on all screen sizes
    - Matches existing admin panel responsive patterns
  - **Dependencies**: T015, T017

---

## Dependencies

### Phase Dependencies
1. **Setup (Phase 1)** must be completed before any backend or frontend work
2. **Foundational Backend (Phase 2)** must be completed before **User Story 1 (Phase 3)**
3. **User Story 1 (Phase 3-4)** must be completed before **User Story 2 (Phase 5)**
4. **Navigation Preservation (Phase 6)** can be done in parallel with Phase 5
5. **Polish (Phase 7)** should be done last, after all core features working

### User Story Dependencies
- **US1 (View Event Details)**: T011-T019 - Core functionality, must work first
- **US2 (Issue Tickets)**: T020-T023 - Builds on US1, requires working detail page
- **US3 (Navigation)**: T024-T025 - Enhancement, can be done after US1 works

### Parallel Opportunities
Can be worked on simultaneously (no dependencies between them):
- T001 (Database index) + T002 (Install react-select) + T003 (EventDetail skeleton)
- T011 (EventInfo) + T012 (TicketStats) + T013 (AttendeeTable skeleton)
- T005 (getEventDetail) + T006 (getEventAttendees) + T007 (getSelectableUsers)

---

## Implementation Strategy

### MVP First (Minimum Viable Product)
**Goal**: Get event detail page loading with data

**MVP Tasks** (Priority 1):
- T001-T004: Setup
- T005, T008: Event detail endpoint
- T011-T012, T014-T015: Event info + stats display
- T026-T027: Basic loading/error handling

**Test MVP**: Can click event from dashboard and see event details with ticket stats

---

### Feature Complete (User Story 1)
**Goal**: Attendee table with search and pagination working

**Add Tasks**:
- T006, T009: Attendee endpoint
- T013, T017-T019: Attendee table with search/pagination
- T028: Attendee loading/error states

**Test US1**: Can view attendee list, search by name, navigate pages

---

### Enhanced (User Story 2)
**Goal**: Can issue tickets from detail page

**Add Tasks**:
- T007, T010: Selectable users endpoint
- T020-T023: Issue tickets modal with multi-select
- T029: Modal loading/error states

**Test US2**: Can issue tickets to multiple users (including invited)

---

### Complete (All User Stories)
**Goal**: Navigation and polish complete

**Add Tasks**:
- T024-T025: Navigation preservation
- T030: Responsive styling

**Test US3**: Navigation preserves dashboard state, data refreshes

---

## Acceptance Criteria Summary

✅ **Phase 1 Complete**: Database indexes added, dependencies installed, routes registered
✅ **Phase 2 Complete**: All 3 backend endpoints working and tested via curl/Postman
✅ **Phase 3-4 Complete**: Event detail page loads with stats and attendee table
✅ **Phase 5 Complete**: Can issue tickets using searchable multi-select
✅ **Phase 6 Complete**: Back navigation preserves dashboard state
✅ **Phase 7 Complete**: Loading/error states implemented, responsive design verified

---

**Total Tasks**: 30  
**Estimated Complexity**: Medium (3-5 days for experienced developer)  
**Critical Path**: T001 → T005 → T008 → T014 → T015 → T016

**Status**: Ready for implementation. Begin with Phase 1 (Setup).
