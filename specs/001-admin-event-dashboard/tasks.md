# Tasks: Admin Event Dashboard

**Feature Branch**: `001-admin-event-dashboard`
**Status**: In Progress

## Phase 1: Setup
*Goal: Initialize project structure and define interfaces.*

- [ ] T001 Create EventController structure in server/src/controllers/EventController.js
- [ ] T002 Define new dashboard routes in server/src/routes/eventRoutes.js
- [ ] T003 Create placeholder components (EventMetrics, EventList) in client/src/components/Events/
- [ ] T004 Add `getDashboardMetrics` and `getEvents` methods to client/src/services/eventService.js

## Phase 2: Foundational
*Goal: Implement core backend logic required for all user stories.*

- [ ] T005 Implement metrics calculation logic (Upcoming, Issued, Check-in Rate) in server/src/controllers/EventController.js
- [ ] T006 Implement `getEvents` query builder with pagination, filtering, and search support in server/src/controllers/EventController.js
- [ ] T007 Implement ticket count aggregation (Issued vs Checked-in) for event list in server/src/controllers/EventController.js

## Phase 3: User Story 1 - View Event Dashboard & Metrics
*Goal: Admin can view key metrics and a default list of upcoming events.*

- [ ] T008 [US1] Connect `GET /metrics` endpoint to controller in server/src/routes/eventRoutes.js
- [ ] T009 [US1] Connect `GET /events` endpoint to controller in server/src/routes/eventRoutes.js
- [ ] T010 [US1] Implement `EventMetrics` component UI to display fetched data in client/src/components/Events/EventMetrics.jsx
- [ ] T011 [US1] Implement `EventList` table structure with columns (Title, Date, Location, Status) in client/src/components/Events/EventList.jsx
- [ ] T012 [US1] Implement "Smart Display" logic for Ticket Count column in client/src/components/Events/EventList.jsx
- [ ] T013 [US1] Integrate Metrics and List components into main dashboard page in client/src/pages/Admin/AdminEvents.jsx

## Phase 4: User Story 2 - Search and Filter Events
*Goal: Admin can filter by status, search by title, and paginate results.*

- [ ] T014 [US2] Verify search and filter logic handles query parameters correctly in server/src/controllers/EventController.js
- [ ] T015 [US2] Add Filter Dropdown (Upcoming/Past) UI in client/src/pages/Admin/AdminEvents.jsx
- [ ] T016 [US2] Add Search Input with debouncing logic in client/src/pages/Admin/AdminEvents.jsx
- [ ] T017 [US2] Implement Pagination controls (Next/Prev, Page X of Y) in client/src/components/Events/EventList.jsx
- [ ] T018 [US2] Connect Search, Filter, and Pagination state to API calls in client/src/pages/Admin/AdminEvents.jsx

## Phase 5: Polish & Cross-Cutting
*Goal: Ensure good UX with loading states and error handling.*

- [ ] T019 Add loading skeletons/spinners for metrics and list in client/src/pages/Admin/AdminEvents.jsx
- [ ] T020 Implement empty state messaging ("No upcoming events", "No results found") in client/src/components/Events/EventList.jsx
- [ ] T021 Add error handling for failed API requests in client/src/pages/Admin/AdminEvents.jsx

## Dependencies

1. **Setup** must be completed before **Foundational**.
2. **Foundational** (Backend logic) must be completed before **US1** (Frontend integration).
3. **US1** (Basic List) must be completed before **US2** (Advanced List features).

## Implementation Strategy

- **MVP (US1)**: Focus on getting the dashboard to load with correct data first. The "Smart Display" for ticket counts is a key detail here.
- **Enhancement (US2)**: Once the list is visible, add the interactivity (Search/Filter/Pagination).
- **Backend First**: Complete the `EventController` logic fully (including search/filter support) in Phase 2 so the Frontend phases (3 & 4) are purely about UI wiring.
