# GET /api/events/:eventId/attendees

**Description**: Fetch paginated list of attendees with aggregated ticket information

**Authentication**: Required (JWT token)  
**Authorization**: ADMIN role only

---

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventId` | integer | Yes | Unique event identifier |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (1-indexed) |
| `search` | string | No | - | Filter by user name/email (partial match) |

**Note**: Page size is fixed at 20 items per page and is not configurable via query parameters.

### Headers

```http
Authorization: Bearer <jwt_token>
```

### Example

```http
GET /api/events/5/attendees?page=1&search=john HTTP/1.1
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
  "attendees": [
    {
      "userId": 12,
      "userName": "John Doe",
      "userEmail": "john.doe@example.com",
      "userStatus": "ACTIVE",
      "ticketCount": 2,
      "firstTicketId": "ABC12345",
      "statusSummary": "2 Issued"
    },
    {
      "userId": 8,
      "userName": "Jane Smith",
      "userEmail": "jane.smith@example.com",
      "userStatus": "ACTIVE",
      "ticketCount": 3,
      "firstTicketId": "XYZ67890",
      "statusSummary": "2 Checked In, 1 Issued"
    },
    {
      "userId": 24,
      "userName": "bob.jones@example.com",
      "userEmail": "bob.jones@example.com",
      "userStatus": "INVITED",
      "ticketCount": 1,
      "firstTicketId": "DEF24680",
      "statusSummary": "Issued"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Field Descriptions**:

**Attendee Object**:
- `userId`: Unique user identifier
- `userName`: Display name (uses `unit_id` if set, otherwise `email`)
- `userEmail`: User's email address
- `userStatus`: User activation status (`ACTIVE` = activated account, `INVITED` = pending activation)
- `ticketCount`: Total number of tickets this user has for the event
- `firstTicketId`: First 8 characters of the user's first ticket code_hash
- `statusSummary`: Human-readable ticket status breakdown
  - If all tickets have same status: just status name (e.g., "Issued")
  - If multiple statuses: count + status for each (e.g., "2 Issued, 1 Checked In")

**Pagination Object**:
- `page`: Current page number (1-indexed)
- `limit`: Items per page (always 20)
- `total`: Total number of unique attendees (users with tickets)
- `totalPages`: Total pages available (Math.ceil(total / limit))

---

### Error Responses

#### 400 Bad Request

**Reason**: Invalid query parameters (e.g., page < 1, limit not 20)

```json
{
  "error": "Bad Request",
  "message": "Invalid pagination parameters"
}
```

---

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
3. **Validate Event**: Verify event exists (404 if not)
4. **Parse Filters**: Extract `page`, `limit`, `search` from query params
5. **Aggregate Tickets**: 
   - Group tickets by `userId` where `eventId` matches
   - Apply search filter on user name/email if provided
   - Apply pagination (OFFSET/LIMIT)
6. **Fetch User Details**: Get user info for matched userIds
7. **Compute Status Summary**: For each user, aggregate ticket statuses
8. **Return**: Array of attendees + pagination metadata

---

## Pagination Behavior

- **Default**: Page 1, 20 items per page
- **Search Reset**: When search query changes, client should reset to page 1
- **Empty Results**: If page exceeds available pages, return empty array (not error)
- **No Tickets**: If event has zero tickets, returns `{ attendees: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }`

---

## Performance Considerations

- **Query Time**: <100ms with composite index on `Ticket(eventId, userId, status)`
- **Payload Size**: ~2KB per page (20 attendees)
- **Search Performance**: Uses `LIKE %search%` on indexed email field, <200ms for 200 total attendees

---

## Examples

### Example 1: Event with No Tickets

**Request**:
```http
GET /api/events/10/attendees?page=1
```

**Response**:
```json
{
  "attendees": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

---

### Example 2: Search Results

**Request**:
```http
GET /api/events/5/attendees?page=1&search=smith
```

**Response**:
```json
{
  "attendees": [
    {
      "userId": 8,
      "userName": "Jane Smith",
      "userEmail": "jane.smith@example.com",
      "userStatus": "ACTIVE",
      "ticketCount": 3,
      "firstTicketId": "XYZ67890",
      "statusSummary": "2 Checked In, 1 Issued"
    },
    {
      "userId": 19,
      "userName": "Tom Smithson",
      "userEmail": "t.smithson@example.com",
      "userStatus": "ACTIVE",
      "ticketCount": 1,
      "firstTicketId": "QWE09876",
      "statusSummary": "Checked In"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

---

### Example 3: Page 2 of Results

**Request**:
```http
GET /api/events/5/attendees?page=2
```

**Response**:
```json
{
  "attendees": [
    {
      "userId": 42,
      "userName": "User 21",
      "userEmail": "user21@example.com",
      "userStatus": "ACTIVE",
      "ticketCount": 1,
      "firstTicketId": "RTY55443",
      "statusSummary": "Issued"
    }
    // ... 19 more attendees (items 21-40)
  ],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### Example 4: Invited User with Ticket

**Response** (showing invited user):
```json
{
  "attendees": [
    {
      "userId": 24,
      "userName": "bob.jones@example.com",
      "userEmail": "bob.jones@example.com",
      "userStatus": "INVITED",
      "ticketCount": 1,
      "firstTicketId": "DEF24680",
      "statusSummary": "Issued"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

**Note**: User with status "INVITED" has ticket issued but hasn't activated account yet. Ticket becomes visible to user once they complete activation.
