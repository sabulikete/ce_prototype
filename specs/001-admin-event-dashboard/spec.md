# Feature Specification: Admin Event Dashboard

**Feature Branch**: `001-admin-event-dashboard`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "update the event management design, for the admin the landing page would contains a section of all the upcoming events, the default list should be all the valid publised events which the dates are equal or more than today. it has a search option and a filter to select upcomming events or past events. within the same page there is a section that show some metrics, not sure what to add but you can suggest what meaningful data to show."

## Clarifications

### Session 2026-01-03
- Q: How should large lists of events be handled? → A: Standard Pagination (10 items per page).
- Q: Should search and filtering happen on the client or server? → A: Server-side (API parameters).
- Q: How should "Check-in Rate" be calculated? → A: Average of the last 3 past events.
- Q: How should the "Ticket Count" column be displayed? → A: Smart Display (Upcoming: "Issued", Past: "Checked-in / Issued").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Event Dashboard & Metrics (Priority: P1)

As an Admin, I want to see an overview of event performance and a list of upcoming events immediately upon landing on the event management page, so that I can quickly assess the status of community activities.

**Why this priority**: This is the primary view for the admin to monitor event health and upcoming activities.

**Independent Test**: Can be tested by navigating to the Admin Event page and verifying the metrics and default list load correctly.

**Acceptance Scenarios**:

1. **Given** I am an Admin on the Event Management page, **When** the page loads, **Then** I see a "Key Metrics" section at the top displaying "Total Upcoming Events", "Total Tickets Issued", and "Avg. Check-in Rate".
2. **Given** I am on the Event Management page, **When** the page loads, **Then** I see a list of events that are `PUBLISHED` and have a start date equal to or greater than today (Upcoming).
3. **Given** there are no upcoming events, **When** I view the list, **Then** I see a friendly "No upcoming events" message.

---

### User Story 2 - Search and Filter Events (Priority: P2)

As an Admin, I want to filter events by status (Upcoming/Past) and search by name, so that I can find specific events that may not be in the default view.

**Why this priority**: Essential for managing a growing list of events and accessing historical data.

**Independent Test**: Can be tested by using the search bar and filter dropdowns and verifying the list updates.

**Acceptance Scenarios**:

1. **Given** the default "Upcoming" view, **When** I select "Past Events" from the filter, **Then** the list updates to show events with end dates before today.
2. **Given** a list of events, **When** I type "Community" into the search bar, **Then** the list filters to show only events with "Community" in the title.
3. **Given** I have applied a search filter, **When** I switch between "Upcoming" and "Past", **Then** the search term persists and applies to the new list.

### Edge Cases

- What happens when search returns no results? -> Show "No events found matching your search".
- What happens if metrics calculation fails? -> Show "--" or "N/A" instead of crashing the page.
- What happens with events starting exactly today? -> They should appear in the "Upcoming" list.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a Metrics Section at the top of the Admin Event page.
- **FR-002**: Metrics MUST include:
    - **Total Upcoming Events**: Count of published events in the future.
    - **Total Tickets Issued**: Sum of all tickets generated for upcoming events.
    - **Check-in Rate**: Average percentage of tickets checked in across the last 3 past events.
- **FR-003**: System MUST display a list of events with columns for: Title, Date/Time, Location, Status, and Ticket Count. The Ticket Count column MUST display "X Issued" for upcoming events and "Y/X Checked-in" for past events.
- **FR-004**: Default view MUST show only `PUBLISHED` events with `start_date >= current_date`.
- **FR-005**: System MUST provide a filter dropdown with options: "Upcoming" (default) and "Past".
- **FR-006**: "Past" filter MUST show events with `end_date < current_date`.
- **FR-007**: System MUST provide a text search input that filters the list by Event Title.
- **FR-008**: Clicking an event in the list MUST navigate to that event's detail/edit page (existing functionality).
- **FR-009**: System MUST support pagination for the event list, displaying 10 events per page with "Next" and "Previous" controls.
- **FR-010**: Search, filtering, and pagination MUST be performed server-side via API query parameters.

### Key Entities *(include if feature involves data)*

- **Event**: Title, Start Date, End Date, Status (Draft/Published), Location.
- **Ticket**: Associated Event, Status (Issued/Checked-in).

## Success Criteria *(mandatory)*

- Admin can view "Total Upcoming Events" and "Tickets Issued" within 2 seconds of page load.
- Admin can switch between "Upcoming" and "Past" events with a single click.
- Search results update instantly (or within <500ms) as the user types or submits.
- Default view accurately filters out past events to reduce clutter.

## Assumptions

- "Valid published events" implies `status === 'PUBLISHED'`.
- Metrics are calculated based on available data in the database (Events and Tickets tables).
- The existing Event Management page structure can be modified to accommodate the new dashboard layout.
