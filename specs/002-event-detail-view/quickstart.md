# Quickstart Guide: Event Detail View

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Research**: [research.md](research.md)  
**Phase**: Phase 1 - Design & Contracts  
**Date**: 2026-01-03

## Overview

This guide provides step-by-step instructions for developers to set up, implement, and test the Event Detail View feature. The feature enables admins to click events from the dashboard and view detailed information including ticket statistics and attendee lists.

---

## Prerequisites

### System Requirements

- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **MySQL**: v8.0 or higher (running and accessible)
- **Git**: For version control

### Project Setup

```bash
# Clone repository (if not already cloned)
git clone <repository-url>
cd ce_app

# Checkout feature branch
git checkout 002-event-detail-view

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Environment Configuration

Ensure `.env` file exists in `server/` directory:

```env
DATABASE_URL="mysql://user:password@localhost:3306/ce_app"
JWT_SECRET="your-secret-key"
PORT=3000
```

### Database Setup

```bash
cd server

# Run Prisma migrations (if any)
npx prisma migrate dev

# Optional: Add indexes for performance
npx prisma db execute --stdin < scripts/add-indexes.sql
```

**Index SQL** (`scripts/add-indexes.sql`):
```sql
CREATE INDEX IF NOT EXISTS idx_ticket_event_user_status 
ON Ticket(eventId, userId, status);
```

---

## Development Workflow

### 1. Start Backend Server

```bash
cd server
npm run dev
```

**Expected Output**:
```
Server running on http://localhost:3000
Database connected successfully
```

**Verify**:
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

---

### 2. Start Frontend Dev Server

Open a new terminal:

```bash
cd client
npm run dev
```

**Expected Output**:
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### 3. Access Application

1. Open browser: `http://localhost:5173`
2. Log in as admin user (if no admin exists, create one):

```bash
cd server
npm run seed:admin
# Creates admin user: admin@example.com / password: admin123
```

3. Navigate to: **Admin → Events**

---

## Testing the Feature

### Manual Test 1: View Event Details (Priority P1)

**Objective**: Verify clickable events navigate to detail page with correct data

**Steps**:
1. Navigate to Admin Events Dashboard (`/admin/events`)
2. Observe list of events in the "Dashboard" tab
3. Click on any event row

**Expected Results**:
- ✅ URL changes to `/admin/events/:id`
- ✅ Page displays event title, dates, location, description
- ✅ Mini dashboard shows:
  - Total tickets issued
  - Breakdown by status (Issued, Checked In, Voided)
- ✅ Attendee table visible (if tickets exist) or "No tickets issued yet" message

**Troubleshooting**:
- If 404 error: Check backend route registration in `eventRoutes.ts`
- If blank data: Check browser console for API errors
- If unauthorized: Verify JWT token in localStorage and admin role

---

### Manual Test 2: Attendee Table with Pagination

**Objective**: Verify attendee table displays correctly with pagination at 20 items

**Prerequisites**: Event with 25+ tickets issued to different users

**Steps**:
1. Navigate to event detail page with 25+ attendees
2. Observe attendee table shows 20 rows
3. Observe pagination controls at bottom showing "Page 1 of 2"
4. Click "Next" or "Page 2"

**Expected Results**:
- ✅ First page shows attendees 1-20
- ✅ Second page shows attendees 21-25
- ✅ Each row displays:
  - User name
  - Ticket count
  - First ticket ID (8 characters)
  - Status summary (e.g., "2 Issued" or "1 Checked In, 1 Issued")
- ✅ Pagination controls active/disabled appropriately

**Troubleshooting**:
- If pagination missing: Check if event has >20 unique users with tickets
- If wrong counts: Verify aggregation query in `eventController.ts`

---

### Manual Test 3: Attendee Search

**Objective**: Verify search filters attendee table by user name

**Prerequisites**: Event with multiple attendees

**Steps**:
1. On event detail page, locate search field above attendee table
2. Type partial name (e.g., "john")
3. Observe table filters in real-time (with 300ms debounce)
4. Clear search field

**Expected Results**:
- ✅ Table shows only matching attendees
- ✅ Pagination resets to page 1 when search applied
- ✅ Message shows "Showing X result(s) for 'john'"
- ✅ If no matches: "No attendees found matching 'john'"
- ✅ Clearing search shows all attendees again

**Troubleshooting**:
- If search doesn't work: Check API query param in browser network tab
- If results wrong: Verify search filter on email/unit_id in backend

---

### Manual Test 4: Issue Tickets from Detail Page (Priority P2)

**Objective**: Verify admin can issue tickets using multi-select dropdown

**Prerequisites**: At least 3 users in system (mix of ACTIVE and INVITED)

**Steps**:
1. On event detail page, click "Issue Tickets" button
2. Modal opens with searchable dropdown
3. Type to search for users (e.g., "smith")
4. Select 2-3 users (including at least one INVITED user)
5. Click "Issue Tickets" button
6. Manually refresh page (F5 or Ctrl+R)

**Expected Results**:
- ✅ Modal displays with dropdown showing all selectable users
- ✅ Dropdown shows status indicators: "(Active)" or "(Invited)"
- ✅ Search filters dropdown options
- ✅ Can select multiple users
- ✅ After submission, modal closes
- ✅ After refresh:
  - Mini dashboard ticket count increased
  - Attendee table includes newly issued tickets
  - Status summary updated

**Troubleshooting**:
- If dropdown empty: Check `/api/users/selectable` endpoint returns data
- If invited users missing: Verify query includes `status IN (ACTIVE, INVITED)`
- If no auto-update: This is expected behavior (manual refresh required per spec)

---

### Manual Test 5: Navigation State Preservation (Priority P3)

**Objective**: Verify returning to dashboard preserves filters but refreshes data

**Steps**:
1. On Admin Events Dashboard, apply search filter (e.g., "Gala")
2. Navigate to page 2 of results
3. Click on an event to view detail page
4. Click browser back button or back navigation link

**Expected Results**:
- ✅ Return to dashboard page 2
- ✅ Search filter "Gala" still applied
- ✅ Event list data is current (not stale from cache)
- ✅ If tickets were issued in step 3-4, they're reflected in the list

**Troubleshooting**:
- If returns to page 1: Check URL query params preserved
- If stale data shown: Verify `useEffect` re-fetches on mount
- If filters cleared: Check `useSearchParams` implementation

---

### Manual Test 6: Edge Cases

#### 6a. Event with Zero Tickets

**Steps**: Navigate to detail page of event with no tickets

**Expected**:
- ✅ Mini dashboard shows all zeros
- ✅ Attendee section displays: "No tickets issued yet"

---

#### 6b. Invited User Status

**Steps**: 
1. Issue ticket to invited user (status = INVITED)
2. View attendee table

**Expected**:
- ✅ User appears in attendee list
- ✅ Status shows "INVITED" (if displaying status) or name shows email only

---

#### 6c. Search No Results

**Steps**: Search for non-existent name "zzz999"

**Expected**:
- ✅ Table empty
- ✅ Message: "No attendees found matching 'zzz999'"

---

#### 6d. Unauthorized Access

**Steps**:
1. Log out
2. Try to access `/admin/events/5` directly via URL

**Expected**:
- ✅ Redirect to login page
- ✅ No data exposed

---

## API Testing (Optional)

### Using cURL

**Get Event Detail**:
```bash
TOKEN="<your-jwt-token>"

curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/events/5
```

**Get Attendees (Page 1)**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3000/api/events/5/attendees?page=1&limit=20"
```

**Get Attendees with Search**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3000/api/events/5/attendees?search=john"
```

**Get Selectable Users**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3000/api/users/selectable"
```

---

## Debugging Guide

### Common Issues

#### Issue: "Event not found" (404)

**Possible Causes**:
- Event ID doesn't exist in database
- Event was deleted/archived

**Debug Steps**:
```bash
# Check if event exists
cd server
npx prisma studio
# Navigate to Event table, search by ID
```

---

#### Issue: Attendee table empty but tickets exist

**Possible Causes**:
- Aggregation query not grouping correctly
- Foreign key issue (orphaned tickets)

**Debug Steps**:
```bash
# Check raw ticket data
mysql -u root -p ce_app
SELECT userId, COUNT(*) FROM Ticket WHERE eventId = 5 GROUP BY userId;
```

---

#### Issue: Search returns no results

**Possible Causes**:
- Case sensitivity issue
- Search field mismatch (searching unit_id but users only have email)

**Debug Steps**:
```sql
-- Check user data
SELECT id, email, unit_id, status FROM User LIMIT 10;

-- Test search manually
SELECT * FROM User WHERE email LIKE '%john%' OR unit_id LIKE '%john%';
```

---

#### Issue: Pagination shows wrong page count

**Possible Causes**:
- Total count query incorrect
- Math.ceil calculation error in frontend

**Debug Steps**:
```javascript
// In browser console
console.log('Total:', data.pagination.total);
console.log('Limit:', data.pagination.limit);
console.log('Expected Pages:', Math.ceil(data.pagination.total / data.pagination.limit));
console.log('Actual Pages:', data.pagination.totalPages);
```

---

## Performance Benchmarking

### Backend Query Performance

```bash
cd server

# Enable query logging in Prisma
# Add to .env:
DEBUG="prisma:query"

# Restart server and observe query times in console
npm run dev
```

**Target Benchmarks**:
- Event detail fetch: <50ms
- Ticket statistics aggregation: <50ms
- Attendee list (20 items): <100ms
- User selection list (100 users): <50ms

---

### Frontend Performance

**Chrome DevTools → Network Tab**:
- Event detail API call: <200ms
- Attendees API call: <300ms
- Total page load: <2s (per SC-002)

**Lighthouse Audit**:
```bash
# Run lighthouse in Chrome DevTools
# Target: Performance score >90
```

---

## Next Steps After Testing

1. **Run Full Acceptance Tests**: Verify all acceptance scenarios in [spec.md](spec.md) pass
2. **Code Review**: Submit PR for review against [plan.md](plan.md) design
3. **Generate Tasks**: Run `/speckit.tasks` to create detailed task breakdown
4. **Begin Implementation**: Follow task phases in `tasks.md` (not yet created)

---

## Support

**Documentation**:
- [spec.md](spec.md) - Feature specification
- [plan.md](plan.md) - Implementation plan
- [research.md](research.md) - Research findings
- [data-model.md](data-model.md) - Data model details
- [contracts/](contracts/) - API contracts

**Troubleshooting**:
- Check server logs: `server/logs/` (if logging configured)
- Check browser console for client-side errors
- Verify database state with Prisma Studio: `npx prisma studio`

---

**Status**: ✅ Quickstart guide complete. Ready for development and testing.
