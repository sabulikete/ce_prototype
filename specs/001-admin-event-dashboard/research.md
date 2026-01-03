# Research: Admin Event Dashboard

**Feature**: Admin Event Dashboard
**Status**: Complete

## Unknowns & Clarifications

### 1. Metrics Calculation Efficiency
- **Question**: How to calculate "Check-in Rate" (Avg of last 3 past events) without performance impact?
- **Finding**:
    - We can use a single aggregation query or two lightweight queries.
    - Query 1: Fetch last 3 past events (IDs).
    - Query 2: Count tickets (issued vs checked-in) for these 3 events.
    - Calculation: `(Total Checked-in / Total Issued) * 100` averaged over the 3 events.
- **Decision**: Implement a dedicated `getDashboardMetrics` service method in the backend that performs these aggregations.

### 2. Server-Side Pagination & Filtering
- **Question**: How to implement search/filter/pagination in Sequelize?
- **Finding**:
    - **Pagination**: Use `limit` and `offset` in `findAll`.
    - **Filtering**: Use `where` clause with `Op.gte` (Upcoming) or `Op.lt` (Past) on `startDate`/`endDate`.
    - **Search**: Use `Op.like` or `Op.iLike` (Postgres) on `title`. Since we use SQLite/Sequelize, `Op.like` with `%query%` is standard.
- **Decision**: Update `getEvents` or create `searchEvents` in `EventController` to accept `page`, `limit`, `status`, and `search` query params.

### 3. Ticket Count Display
- **Question**: How to efficiently get ticket counts for the list view?
- **Finding**:
    - `Event.findAll` can include a count of associated `Tickets`.
    - We need two counts: Total Issued and Total Checked-in.
    - Sequelize `attributes` with `fn('COUNT')` and `group` by Event ID can work, but might be complex with other includes.
    - **Alternative**: A separate `Promise.all` to fetch counts for the page's events, or a subquery.
- **Decision**: Use Sequelize `include` with separate counts if possible, or a raw query for performance if the ORM approach is too heavy. Given the scale (10 items/page), a secondary query to fetch ticket stats for the 10 IDs is acceptable and cleaner.

## Technology Choices

- **Backend**: Node.js/Express + Sequelize (Existing)
- **Frontend**: React + Vite (Existing)
- **Icons**: Lucide-React (Existing)

## Best Practices

- **Debouncing**: Implement debouncing (300ms) on the frontend search input to prevent excessive API calls.
- **Loading States**: Show skeleton loaders or spinners while fetching metrics and list data.
- **Error Handling**: Gracefully handle cases where metrics fail (display "--") while still showing the event list.
