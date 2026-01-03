# Data Model: Admin Event Dashboard

## Entities

### Event (Existing)
- `id`: UUID
- `title`: String
- `description`: Text
- `startDate`: DateTime
- `endDate`: DateTime
- `location`: String
- `status`: Enum (DRAFT, PUBLISHED, CANCELLED)
- `imageUrl`: String

### Ticket (Existing)
- `id`: UUID
- `eventId`: UUID (FK)
- `status`: Enum (ISSUED, CHECKED_IN, CANCELLED)
- `holderName`: String
- `holderEmail`: String

## API Contracts

### 1. Get Dashboard Metrics
**Endpoint**: `GET /api/admin/events/metrics`
**Description**: Retrieves summary metrics for the dashboard.

**Response**:
```json
{
  "totalUpcoming": 12,
  "totalTicketsIssued": 450,
  "avgCheckInRate": 85.5 // Percentage
}
```

### 2. Get Events (Search/Filter)
**Endpoint**: `GET /api/admin/events`
**Query Parameters**:
- `page`: Integer (default 1)
- `limit`: Integer (default 10)
- `status`: String ("upcoming" | "past")
- `search`: String (optional)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Community Meetup",
      "startDate": "2026-02-15T18:00:00Z",
      "endDate": "2026-02-15T20:00:00Z",
      "location": "Main Hall",
      "status": "PUBLISHED",
      "ticketStats": {
        "issued": 50,
        "checkedIn": 0
      }
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

## Validation Rules

- `page`: Must be >= 1.
- `limit`: Must be between 1 and 100.
- `status`: Must be "upcoming" or "past".
