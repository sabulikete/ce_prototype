# GET /api/events/:eventId

**Description**: Fetch detailed event information with ticket statistics

**Authentication**: Required (JWT token)  
**Authorization**: ADMIN role only

---

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventId` | integer | Yes | Unique event identifier |

### Headers

```http
Authorization: Bearer <jwt_token>
```

### Example

```http
GET /api/events/5 HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Response

### Success (200 OK)

**Headers**:
```http
Content-Type: application/json
```

**Body**:
```json
{
  "id": 5,
  "title": "Annual Gala",
  "startDate": "2026-02-15T18:00:00.000Z",
  "endDate": "2026-02-15T23:00:00.000Z",
  "location": "Grand Hall, Downtown",
  "description": "Annual fundraising gala with dinner and entertainment",
  "status": "PUBLISHED",
  "visibility": "MEMBER",
  "createdAt": "2026-01-10T09:30:00.000Z",
  "updatedAt": "2026-01-12T14:20:00.000Z",
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

**Field Descriptions**:
- `ticketStats.total`: Total tickets issued for this event (all statuses)
- `ticketStats.byStatus.issued`: Tickets with status "Issued" (not yet checked in)
- `ticketStats.byStatus.checkedIn`: Tickets that have been scanned/checked in
- `ticketStats.byStatus.voided`: Tickets that have been voided by admin

---

### Error Responses

#### 401 Unauthorized

**Reason**: Missing or invalid JWT token

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

#### 403 Forbidden

**Reason**: Authenticated user does not have ADMIN role

```json
{
  "error": "Forbidden",
  "message": "Admin access required"
}
```

---

#### 404 Not Found

**Reason**: Event with specified ID does not exist

```json
{
  "error": "Not Found",
  "message": "Event not found"
}
```

---

#### 500 Internal Server Error

**Reason**: Database error or unexpected server failure

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Business Logic

1. **Authentication**: Verify JWT token is valid and not expired
2. **Authorization**: Ensure user has `role = "ADMIN"`
3. **Fetch Event**: Query `Event` table by `id`
4. **Compute Statistics**: Aggregate `Ticket` table grouped by `status` where `eventId` matches
5. **Return**: Combine event data with computed ticket statistics

---

## Performance Considerations

- **Query Time**: <50ms with index on `Ticket(eventId, status)`
- **Payload Size**: ~500 bytes (typical)
- **Caching**: Not implemented (data changes frequently with ticket operations)

---

## Examples

### Example 1: Event with No Tickets

```json
{
  "id": 10,
  "title": "Future Workshop",
  "startDate": "2026-03-20T10:00:00.000Z",
  "endDate": null,
  "location": null,
  "description": "Upcoming member workshop",
  "status": "DRAFT",
  "visibility": "MEMBER",
  "createdAt": "2026-01-20T15:00:00.000Z",
  "updatedAt": "2026-01-20T15:00:00.000Z",
  "ticketStats": {
    "total": 0,
    "byStatus": {
      "issued": 0,
      "checkedIn": 0,
      "voided": 0
    }
  }
}
```

### Example 2: Event with All Tickets Checked In

```json
{
  "id": 3,
  "title": "Past Mixer",
  "startDate": "2025-12-10T19:00:00.000Z",
  "endDate": "2025-12-10T22:00:00.000Z",
  "location": "Community Center",
  "description": "Year-end social mixer",
  "status": "ARCHIVED",
  "visibility": "MEMBER",
  "createdAt": "2025-11-01T10:00:00.000Z",
  "updatedAt": "2025-12-11T08:00:00.000Z",
  "ticketStats": {
    "total": 28,
    "byStatus": {
      "issued": 0,
      "checkedIn": 28,
      "voided": 0
    }
  }
}
```
