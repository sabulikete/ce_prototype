# Research: Event Detail View

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)  
**Phase**: Phase 0 - Outline & Research  
**Date**: 2026-01-03

## Overview

This document consolidates research findings for implementing the Event Detail View feature. Research focused on four key areas: attendee data aggregation, navigation state preservation, multi-select component selection, and pagination UX patterns.

---

## R1: Attendee Data Aggregation Strategy

### Decision

**Server-side aggregation using Prisma groupBy with MySQL**

The backend will aggregate tickets per user using Prisma's groupBy functionality, computing ticket counts and status summaries in a single query before sending to the client.

### Rationale

1. **Correctness**: Aggregation logic in one place (backend) ensures consistency across all consumers
2. **Performance**: MySQL performs aggregation efficiently with proper indexes on `eventId` and `userId`
3. **Scalability**: Offloads computation from client, especially important for events with 100+ attendees
4. **Compliance**: Adheres to "Backend Authority" constitutional principle

### Alternatives Considered

**Client-side grouping**:
- ❌ Rejected: Violates "Backend Authority" - business logic should not run on untrusted client
- ❌ Rejected: Requires sending all individual ticket records (N tickets) vs aggregated data (M users, where M ≪ N)
- ❌ Rejected: More complex error handling if grouping logic diverges between views

**Database views**:
- ❌ Rejected: Adds schema complexity for what is essentially a reporting query
- ❌ Rejected: Harder to add dynamic filters (search, pagination) to views
- ✅ Considered but deferred: Could revisit if performance becomes an issue at scale

### Implementation Approach

**Prisma Query Pattern**:

```typescript
// Aggregation query for attendee table
const ticketAggregates = await prisma.ticket.groupBy({
  by: ['userId'],
  where: {
    eventId: eventId,
    user: search ? {
      OR: [
        { email: { contains: search } },
        { unit_id: { contains: search } }
      ]
    } : undefined
  },
  _count: {
    id: true
  },
  _min: {
    code_hash: true  // First ticket ID
  },
  skip: (page - 1) * limit,
  take: limit
});

// Then fetch user details and ticket statuses for these user IDs
const userIds = ticketAggregates.map(agg => agg.userId);

const users = await prisma.user.findMany({
  where: { id: { in: userIds } }
});

const ticketsByUser = await prisma.ticket.groupBy({
  by: ['userId', 'status'],
  where: {
    eventId: eventId,
    userId: { in: userIds }
  },
  _count: { id: true }
});

// Combine into attendee view with status summary like "2 Issued, 1 Checked In"
```

**Performance Considerations**:
- Add composite index on `(eventId, userId)` in Ticket table for efficient grouping
- Pagination limits result set to 20 rows, keeping response size small
- Total count query separate for pagination metadata

### Performance Benchmark

For event with 200 attendees (average 1.5 tickets each = 300 tickets):
- **Expected query time**: <100ms with proper indexes
- **Response payload**: ~5KB for 20 attendees (1 page)
- **Bottleneck**: User detail fetch after aggregation (mitigated by `IN` query with indexed user IDs)

---

## R2: React Router State Preservation Patterns

### Decision

**URL query parameters + React Router `location.state` for preservation, with automatic data refetch on navigation**

Combine URL-based state (search, filter, page) with React Router's location state to preserve dashboard context while ensuring fresh data loads on return navigation.

### Rationale

1. **URL as source of truth**: Search/filter/page in URL enables bookmarking, sharing, browser back/forward
2. **Explicit refresh**: Component re-mount triggers fresh data fetch via useEffect, ensuring no stale data
3. **User expectations**: Users expect "back" button to return to previous context, but with current data
4. **Simplicity**: No complex cache invalidation or state synchronization logic needed

### Alternatives Considered

**React Context for global state**:
- ❌ Rejected: Loses state on page refresh, breaks browser back button
- ❌ Rejected: Adds complexity of context provider management
- ✅ Partial use: Could use context for toast notifications, but not for navigation state

**LocalStorage for persistence**:
- ❌ Rejected: Overly persistent (survives browser close), can lead to confusing stale state
- ❌ Rejected: Requires manual cleanup logic
- ❌ Rejected: URL params already provide persistence for session duration

**React Router v6 location.state for all state**:
- ❌ Rejected: State lost on page refresh
- ❌ Rejected: Not shareable via URL
- ✅ Partial use: Good for transient UI state (e.g., "show success message after ticket issuance")

### Implementation Approach

**Dashboard Component (AdminEvents.tsx)**:

```typescript
const AdminEvents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search') || '';
  const filter = searchParams.get('filter') || 'upcoming';
  
  // Fetch data with current params
  useEffect(() => {
    fetchEvents({ page: currentPage, search: searchQuery, filter });
  }, [currentPage, searchQuery, filter]);
  
  const handleEventClick = (eventId) => {
    // Navigate to detail, URL preserves current state
    navigate(`/admin/events/${eventId}`, {
      state: { returnTo: location.pathname + location.search }
    });
  };
  
  return (/* dashboard UI */);
};
```

**Detail Page Component (EventDetail.tsx)**:

```typescript
const EventDetail = () => {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleBackClick = () => {
    const returnPath = location.state?.returnTo || '/admin/events';
    navigate(returnPath);  // Returns to dashboard with preserved URL params
    // Dashboard component will re-fetch with current params automatically
  };
  
  return (/* detail page UI with back button */);
};
```

**Key Points**:
- URL params (`?page=2&search=gala`) persist through navigation
- `location.state.returnTo` captures exact return URL
- Dashboard `useEffect` triggers fresh data fetch when re-mounted
- No manual cache invalidation needed

---

## R3: Searchable Multi-Select Component Options

### Decision

**Use `react-select` library with `isMulti` prop and custom formatting for user status**

The `react-select` library provides robust searchable multi-select functionality, supports TypeScript, and allows custom option rendering to display user activation status.

### Rationale

1. **Proven library**: 40k+ GitHub stars, actively maintained, excellent TypeScript support
2. **Built-in features**: Search/filter, keyboard navigation, accessibility (ARIA), customizable styling
3. **Performance**: Virtualizes long lists (important for 100+ users), debounced search
4. **Flexibility**: Custom `formatOptionLabel` for status indicators (Active/Invited)
5. **Integration**: Works with existing React ecosystem, no conflicting dependencies

### Alternatives Considered

**Custom implementation**:
- ❌ Rejected: Significant development time for search, keyboard nav, accessibility
- ❌ Rejected: Reinventing well-solved problem violates "Simplicity and Restraint"
- ❌ Rejected: Likely to have edge case bugs that `react-select` has already addressed

**`@mui/material` Autocomplete**:
- ❌ Rejected: Would require adding Material-UI dependency (heavy library, 1MB+)
- ❌ Rejected: Project doesn't use Material-UI elsewhere, inconsistent design system
- ✅ Good alternative if project already used MUI

**`downshift` (lower-level primitive)**:
- ❌ Rejected: Requires more implementation work (dropshift is a hook, not a component)
- ❌ Rejected: Less TypeScript-friendly
- ✅ Good for highly custom UX, but overkill for standard multi-select

### Implementation Approach

**Installation**:
```bash
npm install react-select
npm install --save-dev @types/react-select
```

**Component Usage**:

```typescript
import Select from 'react-select';

interface UserOption {
  value: number;
  label: string;
  email: string;
  status: 'ACTIVE' | 'INVITED';
}

const IssueTicketsModal = ({ eventId, onClose }) => {
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  
  // Fetch users for dropdown
  useEffect(() => {
    api.getSelectableUsers().then(users => {
      const options = users.map(u => ({
        value: u.id,
        label: u.name || u.email,
        email: u.email,
        status: u.status
      }));
      setUserOptions(options);
    });
  }, []);
  
  const formatOptionLabel = ({ label, status, email }: UserOption) => (
    <div>
      <strong>{label}</strong> ({email})
      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
        {status === 'INVITED' ? '(Invited)' : '(Active)'}
      </span>
    </div>
  );
  
  const handleSubmit = async () => {
    const userIds = selectedUsers.map(u => u.value);
    await api.issueTickets(eventId, userIds);
    onClose();
  };
  
  return (
    <Modal>
      <h2>Issue Tickets</h2>
      <Select
        isMulti
        options={userOptions}
        value={selectedUsers}
        onChange={setSelectedUsers}
        formatOptionLabel={formatOptionLabel}
        placeholder="Search and select users..."
        isSearchable
        closeMenuOnSelect={false}
      />
      <button onClick={handleSubmit}>Issue Tickets</button>
    </Modal>
  );
};
```

**Styling Customization**:
```typescript
const customStyles = {
  control: (provided) => ({
    ...provided,
    borderColor: '#ccc',
    '&:hover': { borderColor: '#888' }
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: '#e0e0e0'
  })
};

<Select styles={customStyles} ... />
```

**Performance Notes**:
- `react-select` handles 100+ options efficiently
- For >500 users, consider implementing backend search (pass search query to API)
- Current approach (fetch all users client-side) is acceptable for MVP with <200 users

---

## R4: Pagination with Search UX Patterns

### Decision

**Reset to page 1 when search query changes, preserve page on other actions**

When user types in search field, pagination resets to page 1. Clearing search or navigating between pages preserves the current page number. This follows industry-standard UX patterns.

### Rationale

1. **User expectations**: Most admin interfaces (AWS Console, Stripe, GitHub) reset to page 1 on search
2. **Avoids confusion**: If search yields 15 results (1 page), showing "Page 3" would be misleading
3. **Predictable behavior**: User sees first results immediately after searching
4. **Technical simplicity**: No complex state management for "last valid page"

### Alternatives Considered

**Preserve page number always**:
- ❌ Rejected: Can show empty page if search results fit on fewer pages
- ❌ Rejected: Example: User on page 5 (events 81-100), searches "Gala", gets 3 results, sees page 5 (empty)
- ❌ Rejected: Requires "smart fallback" logic (if page > totalPages, go to last page) - adds complexity

**Always show all search results (no pagination)**:
- ❌ Rejected: Inconsistent UX (paginated normally, unpaginated during search)
- ❌ Rejected: Performance issue if search matches 50+ results
- ❌ Rejected: Spec explicitly requires pagination at >20 items (FR-010)

**Infinite scroll instead of pagination**:
- ❌ Rejected: Not requested in spec
- ❌ Rejected: Harder to navigate to specific attendee (no page numbers)
- ❌ Rejected: Breaks browser back button expectations

### Implementation Approach

**Search + Pagination State Management**:

```typescript
const AttendeeTable = ({ eventId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);  // RESET to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Fetch attendees with search + pagination
  const { data, isLoading } = useQuery(
    ['attendees', eventId, debouncedSearch, currentPage],
    () => api.getEventAttendees(eventId, {
      page: currentPage,
      limit: 20,
      search: debouncedSearch
    })
  );
  
  return (
    <div>
      <input
        type="text"
        placeholder="Search attendees..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      {isLoading ? (
        <LoadingSkeleton />
      ) : data.attendees.length === 0 ? (
        searchQuery ? (
          <p>No attendees found matching "{searchQuery}"</p>
        ) : (
          <p>No tickets issued yet</p>
        )
      ) : (
        <>
          <table>
            {/* Render data.attendees */}
          </table>
          
          <Pagination
            current={currentPage}
            total={data.pagination.totalPages}
            onChange={setCurrentPage}
          />
          
          {debouncedSearch && (
            <p style={{ fontSize: '14px', color: '#666' }}>
              Showing {data.pagination.total} result(s) for "{debouncedSearch}"
            </p>
          )}
        </>
      )}
    </div>
  );
};
```

**UX States**:

| State | Display | Page Number |
|-------|---------|-------------|
| Initial load | All attendees, paginated | 1 |
| User on page 3 | Attendees 41-60 | 3 |
| User types "John" | Results matching "John" | 1 (reset) |
| Clear search | All attendees again | 1 (reset) |
| Navigate pages during search | Filtered results, paginated | 2, 3, etc. |

**Empty State Messages**:
- No tickets issued (no search): "No tickets issued yet"
- Search returns 0 results: "No attendees found matching 'John'"
- Loading state: Skeleton placeholder (avoid flash of empty state)

---

## Summary

### Decisions Made

1. **R1 - Aggregation**: Server-side using Prisma groupBy with MySQL
2. **R2 - Navigation**: URL query params + React Router state, auto-refresh on return
3. **R3 - Multi-Select**: `react-select` library with custom status formatting
4. **R4 - Search UX**: Reset to page 1 on search, preserve page otherwise

### Dependencies to Add

```json
{
  "react-select": "^5.8.0",
  "@types/react-select": "^5.0.1"
}
```

### Database Indexes to Add

```sql
-- Composite index for efficient ticket aggregation by event and user
CREATE INDEX idx_ticket_event_user ON Ticket(eventId, userId);

-- Already exists in schema (verify): Index on userId for JOIN performance
CREATE INDEX idx_ticket_userId ON Ticket(userId);
```

### No Breaking Changes

All decisions work within existing architecture and constitutional constraints. No new models, no schema migrations beyond index additions.

---

**Status**: ✅ Research complete. Ready to proceed to Phase 1 (Design & Contracts).

**Next**: Generate `data-model.md`, `contracts/`, and `quickstart.md` per [plan.md](plan.md) Phase 1.
