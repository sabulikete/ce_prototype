# Data Model: Event Detail View

**Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Research**: [research.md](research.md)  
**Phase**: Phase 1 - Design & Contracts  
**Date**: 2026-01-03

## Overview

This document defines the data model for the Event Detail View feature. The feature uses existing database entities (Event, Ticket, User) without requiring schema changes. It introduces computed aggregates for display purposes that are calculated on-demand from existing data.

---

## Core Entities

### Event (Existing Model)

**Source**: Prisma schema `Event` model  
**Table**: `Event`

**Properties**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, Auto-increment | Unique event identifier |
| title | String | Required | Event name |
| startDate | DateTime | Required | Event start date and time |
| endDate | DateTime? | Optional | Event end date and time |
| location | String? | Optional | Event venue/location |
| description | String? | Optional | Event description |
| status | ContentStatus | Enum | DRAFT, PUBLISHED, ARCHIVED |
| visibility | Visibility | Enum | PUBLIC, MEMBER |
| createdAt | DateTime | Auto | Record creation timestamp |
| updatedAt | DateTime | Auto | Record modification timestamp |

**Relationships**:
- Has many `Ticket` (1:N)

**Validation Rules**:
- `startDate` is required
- `status` must be one of: DRAFT, PUBLISHED, ARCHIVED
- Only PUBLISHED events visible to non-admins
- Event detail page accessible for events in any status (admin only)

**No Schema Changes Required**: ✅

---

### Ticket (Existing Model)

**Source**: Prisma schema `Ticket` model  
**Table**: `Ticket`

**Properties**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, Auto-increment | Unique ticket identifier |
| code_hash | String | Unique | QR code hash (8 chars visible) |
| eventId | Int | FK → Event | Associated event |
| userId | Int | FK → User | Ticket holder |
| status | TicketStatus | Enum | Issued, Checked In, Voided |
| createdAt | DateTime | Auto | Ticket issuance timestamp |
| checkedInAt | DateTime? | Optional | Check-in timestamp |

**Relationships**:
- Belongs to `Event` (N:1)
- Belongs to `User` (N:1)

**State Transitions**:
```
Issued ──scan──> Checked In [terminal]
  │
  └──admin──> Voided [terminal]
```

**Business Rules**:
- Ticket can only be checked in once
- Ticket cannot be voided after check-in
- Multiple tickets per user per event allowed

**No Schema Changes Required**: ✅

---

### User (Existing Model)

**Source**: Prisma schema `User` model  
**Table**: `User`

**Properties**:
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Int | PK, Auto-increment | Unique user identifier |
| email | String | Unique, Required | User email address |
| unit_id | String? | Optional | Member unit/identifier |
| role | Role | Enum | MEMBER, ADMIN, STAFF |
| status | UserStatus | Enum | ACTIVE, INVITED, SUSPENDED |
| createdAt | DateTime | Auto | Account creation timestamp |

**Relationships**:
- Has many `Ticket` (1:N)

**Status Meanings**:
- `ACTIVE`: User has activated their account (can log in, view their tickets)
- `INVITED`: User invited but hasn't completed account activation (admin can still issue tickets)
- `SUSPENDED`: Account disabled (not relevant for this feature)

**No Schema Changes Required**: ✅

---

## Computed Aggregates

These are **not** stored in the database. They are calculated on-demand from existing data.

### Ticket Statistics (Computed)

**Purpose**: Mini dashboard display showing ticket breakdown by status

**Calculation Source**: Aggregate query on `Ticket` table filtered by `eventId`

**Structure**:
```typescript
interface TicketStatistics {
  total: number;                    // COUNT(*) WHERE eventId = X
  byStatus: {
    issued: number;                 // COUNT(*) WHERE status = 'Issued'
    checkedIn: number;              // COUNT(*) WHERE status = 'Checked In'
    voided: number;                 // COUNT(*) WHERE status = 'Voided'
  };
}
```

**Query Pattern** (Prisma):
```typescript
const stats = await prisma.ticket.groupBy({
  by: ['status'],
  where: { eventId },
  _count: { id: true }
});

// Transform to TicketStatistics format
const ticketStats = {
  total: stats.reduce((sum, s) => sum + s._count.id, 0),
  byStatus: {
    issued: stats.find(s => s.status === 'Issued')?._count.id || 0,
    checkedIn: stats.find(s => s.status === 'Checked In')?._count.id || 0,
    voided: stats.find(s => s.status === 'Voided')?._count.id || 0
  }
};
```

**Performance**: O(1) with index on `(eventId, status)` - typically <10ms for <1000 tickets

---

### Attendee View (Computed)

**Purpose**: One row per user with aggregated ticket information for attendee table display

**Calculation Source**: JOIN `Ticket` with `User`, GROUP BY `userId`

**Structure**:
```typescript
interface AttendeeView {
  userId: number;                   // User.id
  userName: string;                 // User.email or User.unit_id (display name)
  userEmail: string;                // User.email
  userStatus: 'ACTIVE' | 'INVITED'; // User.status
  ticketCount: number;              // COUNT(*) grouped by userId
  firstTicketId: string;            // MIN(code_hash) - truncated to 8 chars
  statusSummary: string;            // e.g., "2 Issued, 1 Checked In"
}
```

**Query Pattern** (Prisma - two-step approach)**:

Step 1: Aggregate tickets by user
```typescript
const ticketAggregates = await prisma.ticket.groupBy({
  by: ['userId'],
  where: {
    eventId,
    user: search ? {
      OR: [
        { email: { contains: search } },
        { unit_id: { contains: search } }
      ]
    } : undefined
  },
  _count: { id: true },
  _min: { code_hash: true },
  skip: (page - 1) * 20,
  take: 20
});
```

Step 2: Fetch user details and status breakdown
```typescript
const userIds = ticketAggregates.map(agg => agg.userId);

const users = await prisma.user.findMany({
  where: { id: { in: userIds } },
  select: { id: true, email: true, unit_id: true, status: true }
});

const statusBreakdown = await prisma.ticket.groupBy({
  by: ['userId', 'status'],
  where: { eventId, userId: { in: userIds } },
  _count: { id: true }
});

// Combine into AttendeeView[]
const attendees: AttendeeView[] = ticketAggregates.map(agg => {
  const user = users.find(u => u.id === agg.userId);
  const statuses = statusBreakdown.filter(sb => sb.userId === agg.userId);
  
  const statusSummary = statuses
    .map(s => `${s._count.id} ${s.status}`)
    .join(', ');
  
  return {
    userId: agg.userId,
    userName: user.unit_id || user.email,
    userEmail: user.email,
    userStatus: user.status,
    ticketCount: agg._count.id,
    firstTicketId: agg._min.code_hash.substring(0, 8),
    statusSummary: statuses.length === 1 ? statuses[0].status : statusSummary
  };
});
```

**Pagination**: 20 items per page (per FR-010, FR-011)

**Search**: Filters by user email or unit_id (case-sensitive in MySQL, use `contains`)

**Performance**: 
- With indexes on `(eventId, userId)`: <100ms for 200 attendees
- Pagination limits result set to 20 rows, keeping queries fast
- Total count query separate: `COUNT(DISTINCT userId) WHERE eventId = X`

---

## Indexes Required

### Existing Indexes (Verify in Schema)

```sql
-- Primary keys (auto-indexed)
CREATE INDEX idx_event_pk ON Event(id);
CREATE INDEX idx_ticket_pk ON Ticket(id);
CREATE INDEX idx_user_pk ON User(id);

-- Foreign keys (should be indexed)
CREATE INDEX idx_ticket_eventId ON Ticket(eventId);
CREATE INDEX idx_ticket_userId ON Ticket(userId);
```

### New Indexes to Add

```sql
-- Composite index for efficient groupBy queries
CREATE INDEX idx_ticket_event_user_status ON Ticket(eventId, userId, status);

-- This single index supports:
-- 1. Grouping tickets by userId for a specific event
-- 2. Filtering tickets by status within an event
-- 3. JOIN performance when fetching user details
```

**Rationale**: MySQL uses leftmost prefix matching. Index on `(eventId, userId, status)` covers:
- `WHERE eventId = X` (leftmost)
- `WHERE eventId = X AND userId = Y` (leftmost + second)
- `WHERE eventId = X AND userId = Y AND status = Z` (all three)
- `GROUP BY userId` within `WHERE eventId = X` context

---

## Validation Rules Summary

| Entity | Field | Rule | Enforced By |
|--------|-------|------|-------------|
| Event | id | Valid event exists | Backend (404 if not found) |
| Event | - | Admin-only access | Middleware (auth.ts) |
| Ticket | status | One of: Issued, Checked In, Voided | Prisma enum constraint |
| Ticket | eventId | FK constraint to Event | Database FK |
| Ticket | userId | FK constraint to User | Database FK |
| User | status | ACTIVE or INVITED for ticket issuance | Backend validation |
| Attendee Table | page | Must be > 0 | Backend validation |
| Attendee Table | limit | Fixed at 20 | Backend constant |
| Attendee Table | search | Optional string | Backend sanitization |

---

## Data Flow Diagrams

### Event Detail Page Load

```
Client Request
    ↓
GET /api/events/:eventId
    ↓
Backend: Fetch Event + Compute TicketStatistics
    ↓
Response: { event, ticketStats }
    ↓
Client: Render page header + mini dashboard
    ↓
GET /api/events/:eventId/attendees?page=1
    ↓
Backend: Compute AttendeeView[] with pagination
    ↓
Response: { attendees, pagination }
    ↓
Client: Render attendee table
```

### Ticket Issuance Flow

```
Client: Click "Issue Tickets"
    ↓
GET /api/users/selectable?search=...
    ↓
Backend: Fetch Users WHERE status IN (ACTIVE, INVITED)
    ↓
Client: Display searchable multi-select
    ↓
User: Select users + Submit
    ↓
POST /api/tickets/bulk { eventId, userIds }
    ↓
Backend: Create Ticket records (status = Issued)
    ↓
Response: 201 Created
    ↓
Client: Close modal, user manually refreshes (F5)
    ↓
GET /api/events/:eventId (refetch)
GET /api/events/:eventId/attendees (refetch)
```

---

## Future Considerations

**Not in current scope, but documented for future reference:**

1. **Real-time updates**: If requirements change to need live updates, consider:
   - WebSocket connection for ticket status changes
   - Server-Sent Events (SSE) for simpler one-way updates
   - Polling interval (every 30s) as lightweight alternative

2. **Attendee detail drill-down**: If users need to see all tickets per attendee:
   - Add `GET /api/users/:userId/tickets?eventId=X` endpoint
   - Modal or expandable row showing individual ticket statuses

3. **Export functionality**: If CSV export is requested:
   - Add `GET /api/events/:eventId/attendees/export` endpoint
   - Stream CSV generation for large datasets
   - Include all fields (not paginated)

4. **Advanced filtering**: If requested:
   - Filter by ticket status (show only users with Checked In tickets)
   - Filter by user status (show only INVITED users)
   - Date range filter (tickets issued between X and Y)

---

## Schema Diff

**Before**: No changes (using existing tables)

**After**: Add indexes only

```sql
-- Add to migration file
CREATE INDEX idx_ticket_event_user_status 
ON Ticket(eventId, userId, status);
```

**Migration Safety**:
- Index creation is non-blocking in MySQL (online DDL)
- No data changes, no risk of data loss
- Can be added without downtime

---

**Status**: ✅ Data model complete. No schema migrations required (indexes only).

**Next**: Generate API contracts in `contracts/` directory.
