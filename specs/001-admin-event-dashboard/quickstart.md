# Quickstart: Admin Event Dashboard

## Prerequisites

- Node.js v20+
- SQLite database initialized

## Running the Feature

1. **Start the Server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Start the Client**:
   ```bash
   cd client
   npm run dev
   ```

3. **Access the Dashboard**:
   - Navigate to `http://localhost:5173/admin/events`
   - Ensure you are logged in as an Admin.

## Testing

- **Manual Verification**:
    - Check metrics at the top of the page.
    - Toggle between "Upcoming" and "Past" filters.
    - Use the search bar to find specific events.
    - Verify pagination works if you have >10 events.
