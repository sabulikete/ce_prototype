# API Specification

**Feature**: Member Portal Platform MVP

## Standards
- **Protocol**: REST over HTTP/1.1
- **Format**: JSON
- **Auth**: Bearer Token (JWT) in `Authorization` header.
- **Errors**: Standard HTTP codes (400, 401, 403, 404, 500) with JSON body `{ "error": "message" }`.

## Endpoints

### 1. Authentication
- `POST /api/auth/login`
    - Body: `{ email, password }`
    - Resp: `{ token, user: { id, role, ... } }`
- `POST /api/auth/forgot-password`
    - Body: `{ email }`
- `POST /api/auth/reset-password`
    - Body: `{ token, newPassword }`

### 1b. Invites (Onboarding)
- `POST /api/admin/invites`
    - Body: `{ email, role: 'MEMBER' | 'STAFF' | 'ADMIN', unitId? }`
    - Resp: `{ inviteLink, expiresAt }`
- `GET /api/invites/:token`
    - Desc: Validate invite token (public); returns basic invite metadata if valid.
    - Resp: `{ email, role, unitId?, expiresAt }`
- `POST /api/invites/:token/accept`
    - Body: `{ password }`
    - Resp: `{ token, user: { id, role, ... } }`
    - Errors: invalid/expired/already-used token

### 2. Content (Public & Member)
- `GET /api/content`
    - Query: `type`, `limit`, `offset`
    - Logic: Filters by `status=PUBLISHED`. Filters `visibility` based on caller role.
    - For unauthenticated requests, only return visibility=PUBLIC.
- `GET /api/content/:id`
    - Logic: 404 if not published or not visible to user.

### 3. Admin Content Management
- `POST /api/admin/content`
- `PUT /api/admin/content/:id`
- `DELETE /api/admin/content/:id` (Soft delete/Archive)
- `PATCH /api/admin/content/:id/status`
    - Body: `{ status: 'PUBLISHED' | 'ARCHIVED' }`
- `PATCH /api/admin/content/:id/pin`
    - Body: `{ isPinned: true }`

### 4. Events & Tickets
- `GET /api/events` (Public/Member view)
- `POST /api/admin/events/:id/tickets`
    - Body: `{ userIds: [] }`
    - Desc: Issue tickets to users.
- `GET /api/tickets/my-tickets`
    - Desc: Current user's tickets.
- `POST /api/staff/check-in`
    - Body: `{ ticketToken, eventId }`
    - Resp: `{ success: true, memberName: "John Doe" }`
    - Error: `{ success: false, reason: "ALREADY_CHECKED_IN" }`

### 5. Billing
- `GET /api/billing/my-statements`
    - Query: `limit`, `offset`
    - Logic: Enforce rolling window (e.g., last 12 months).
- `GET /api/billing/download/:id`
    - Desc: Stream PDF.
    - Security: Verify `user_id` matches statement owner.
- `POST /api/admin/billing/upload`
    - Multipart Form: `file` (PDF), `userId`, `period`.
- `POST /api/admin/billing/bulk-upload`
    - Multipart Form: `file` (ZIP).
    - Resp: `{ total: 50, success: 48, failures: [{ file: "bad.pdf", error: "..." }], results: [{ file, userId, unitId, period, status: 'SUCCESS' | 'FAILED', error? }] }`

## Rate Limiting
- **Login**: 5 attempts per minute per IP.
- **Check-in**: 60 requests per minute per Staff user (allow rapid scanning).
- **Public API**: 100 requests per minute per IP.
