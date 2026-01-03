# Feature Specification: Event Detail View

**Feature Branch**: `002-event-detail-view`  
**Created**: January 3, 2026  
**Status**: Draft  
**Input**: User description: "Improve events dashboard with clickable event list that navigates to a detailed event page showing mini dashboard with ticket statistics, event information, and attendee table"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Event Details (Priority: P1)

Admin clicks on an event from the dashboard list and is navigated to a dedicated event detail page that displays comprehensive information about the selected event including ticket statistics and attendee list.

**Why this priority**: This is the core functionality that enables admins to drill down from the dashboard overview to specific event details. Without this, the dashboard remains a read-only summary with no way to manage individual events.

**Independent Test**: Can be fully tested by clicking any event in the dashboard list and verifying that the detail page loads with correct event information, and delivers immediate value by showing ticket statistics and attendee information in one consolidated view.

**Acceptance Scenarios**:

1. **Given** admin is viewing the events dashboard, **When** they click on any event in the list, **Then** they are navigated to a dedicated event detail page showing that event's information
2. **Given** admin is on the event detail page, **When** the page loads, **Then** they see a mini dashboard showing total tickets issued and breakdown by status (Issued, Checked In, Voided)
3. **Given** admin is on the event detail page, **When** the page loads, **Then** they see complete event details including name, date, description, location, and other metadata
4. **Given** admin is on the event detail page, **When** the page loads, **Then** they see a table listing all attendees with one row per user showing their name, total ticket count, first ticket ID (truncated), and aggregate status representation
5. **Given** admin is viewing an attendee table with many users, **When** they type a name in the search field, **Then** the table filters to show only attendees whose names match the search query

---

### User Story 2 - Issue Tickets from Event Detail (Priority: P2)

Admin can issue new tickets to members directly from the event detail page using a prominent action button that opens the ticket issuance workflow.

**Why this priority**: This enables the primary action admins need to take on events - issuing tickets to members. It's prioritized after viewing because admins need to see the current state before taking action.

**Independent Test**: Can be tested by navigating to any event detail page, clicking the "Issue Tickets" button, and successfully issuing tickets to one or more users, delivering immediate value by allowing ticket management without switching pages.

**Acceptance Scenarios**:

1. **Given** admin is viewing an event detail page, **When** they click the "Issue Tickets" button, **Then** a modal appears with a searchable dropdown showing all users including those who have been invited but not yet activated
2. **Given** admin is in the ticket issuance modal, **When** they type in the search field, **Then** the dropdown filters to show matching users and allows selecting multiple users at once
3. **Given** admin has selected one or more users (including invited users), **When** they confirm the issuance, **Then** tickets are created for the selected users
4. **Given** tickets were issued to an invited user, **When** that user activates their account, **Then** they can see the tickets issued to them

---

### User Story 3 - Navigate Back to Dashboard (Priority: P3)

Admin can easily return to the events dashboard from the event detail page using intuitive navigation elements.

**Why this priority**: This ensures smooth navigation flow and prevents users from feeling trapped on the detail page, though it's lower priority as browser back button provides basic functionality.

**Independent Test**: Can be tested by navigating to any event detail page and verifying that clicking the back/navigation element returns user to the dashboard with the same filters/page state preserved.

**Acceptance Scenarios**:

1. **Given** admin is on an event detail page, **When** they click the back navigation element, **Then** they return to the events dashboard
2. **Given** admin navigated from dashboard page 2 with a search filter active, **When** they return from event detail page, **Then** they return to page 2 with the same search filter still applied and data refreshed to show current state

---

### Edge Cases

- What happens when an event has zero tickets issued? (Display "No tickets issued yet" message)
- How does system handle viewing an event that was deleted by another admin? (Show error message and redirect to dashboard)
- What happens when ticket data is loading? (Show loading skeleton for attendee table)
- How does system handle events with many attendees? (Implement pagination with 20 items per page and search functionality)
- What happens when search returns no matching attendees? (Display "No attendees found matching '[search term]'" message)
- What happens when admin issues tickets to invited users who haven't activated? (Tickets are created and associated with their invitation; become visible upon activation)
- How are invited vs activated users distinguished in the user selection dropdown? (Show activation status indicator like "(Invited)" or "(Active)" next to user names)
- What happens when user tries to access event detail page directly via URL without authentication? (Redirect to login page)
- How does system handle network errors when loading event details? (Show error state with retry button)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST make each event in the dashboard list clickable and navigate to a unique URL for that event's detail page
- **FR-002**: System MUST display a mini dashboard at the top of the event detail page showing total tickets issued and count by status (Issued, Checked In, Voided)
- **FR-003**: System MUST display complete event information including title, start date, end date, description, location, and status
- **FR-004**: System MUST display an "Issue Tickets" button prominently on the event detail page that opens a modal with a searchable dropdown allowing multi-select of users (including invited users who have not yet activated their accounts)
- **FR-005**: System MUST display a table of attendees with one row per user, showing user name, total number of tickets they have, truncated ticket ID (first 8 characters of their first ticket), and an aggregate status display (e.g., "2 Issued, 1 Checked In" when user has multiple tickets with different statuses, or simply "Issued" when all tickets share the same status)
- **FR-006**: System MUST handle loading states while fetching event details and ticket information
- **FR-007**: System MUST handle error states if event cannot be found or loaded
- **FR-008**: System MUST preserve dashboard filter and pagination state when navigating back from event detail page, while refreshing the underlying data to show current information
- **FR-009**: System MUST restrict access to event detail page to authenticated admin users only
- **FR-010**: System MUST implement pagination for attendee table with 20 items per page when event has more than 20 attendees
- **FR-011**: System MUST provide a search function for the attendee table that filters results by user name
- **FR-012**: System MUST allow tickets to be issued to invited users who have not yet activated their accounts, and those tickets MUST become visible to users once they activate their accounts

### Key Entities

- **Event**: Represents a scheduled event with properties including ID, title, dates (start and end), location, description, status, and ticket statistics
- **Ticket**: Represents an issued ticket with properties including ID (code_hash), event relationship, user relationship, status (Issued/Checked In/Voided), and timestamps
- **User/Attendee**: Represents a user who has been issued tickets, with properties including ID, name/email, activation status (invited vs activated), and relationship to tickets
- **Ticket Statistics**: Aggregate data showing total count and breakdown by status for a specific event

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can navigate from dashboard to event detail page in one click
- **SC-002**: Event detail page loads and displays all information in under 2 seconds
- **SC-003**: Mini dashboard accurately reflects current ticket statistics (total and by status) within 1 second of page load
- **SC-004**: Attendee table displays all required information (name, ticket count, truncated ID, status) for each attendee
- **SC-005**: Admins can issue tickets from event detail page with same workflow that takes under 30 seconds
- **SC-006**: Navigation back to dashboard preserves user's previous view state (filters, page number, search query)
- **SC-007**: Attendee table handles events with up to 200 attendees without performance degradation using pagination (20 items per page)
- **SC-008**: Attendee search filters results in under 1 second for events with up to 200 attendees
- **SC-009**: Error states are clearly communicated with actionable recovery options (e.g., retry button)

## Assumptions

- Event detail page will reuse and refactor existing ticket management page components
- The existing authentication and authorization middleware will protect the new route
- Event IDs are stable and can be used in URLs
- The existing issue tickets modal/workflow can be adapted to include searchable multi-select dropdown
- The system already supports user invitations and tracks activation status
- Dashboard state (filters, page, search) can be preserved using React Router state or query parameters
- Ticket issuance from detail page uses the same backend API endpoints
- Tickets issued to invited users are properly associated and become accessible upon account activation

## Scope Boundaries

**In Scope**:
- Clickable event list navigation
- Event detail page with mini dashboard
- Attendee table with specified columns
- Attendee table search by user name
- Attendee table pagination (20 items per page)
- Issue tickets button and workflow integration
- Loading and error states
- Back navigation with state preservation

**Out of Scope**:
- Editing event details from this page (should use separate event management feature)
- Bulk ticket operations (void, resend, etc.)
- Exporting attendee list
- Real-time updates via WebSockets (will use manual refresh/page reload to see updated data after ticket operations)
- Automatic refresh or polling to update statistics and attendee table
- Advanced filtering/sorting of attendee table
- Attendee profile viewing
- Email notifications when tickets are issued from this page

## Clarifications

### Session 2026-01-03

- Q: How should attendees with multiple tickets be displayed in the attendee table? → A: One row per user, showing total ticket count, first ticket ID, and most common status (with aggregate like "2 Issued, 1 Checked In")
- Q: What is the maximum acceptable delay for statistics updates after a ticket operation? → A: Real-time updates not needed; users will manually refresh the page to see updated results
- Q: Should the dashboard data refresh when navigating back after ticket operations, or preserve the exact cached state from before? → A: Refresh dashboard data while preserving filters/page/search (fetch fresh data with same parameters)
- Q: What is the page size for the attendee table pagination? → A: 20 items per page, with search function to filter by user name
- Q: How should admins select users when issuing tickets from the event detail page? → A: Searchable dropdown with multi-select capability; include invited users who haven't activated accounts yet; once activated, users can see tickets issued to them

## Dependencies

- Existing authentication system (JWT tokens, role-based access)
- Existing event and ticket data models in database
- Existing ticket issuance API endpoints
- React Router for navigation and routing
- Existing UI component library and styling system
