Updated Implementation Spec
1) Database schema
1.1 events
CREATE TABLE events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,

  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  location VARCHAR(255) NULL,
  start_at DATETIME NULL,
  end_at DATETIME NULL,

  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  is_pinned TINYINT(1) NOT NULL DEFAULT 0,

  next_ticket_number INT NOT NULL DEFAULT 1,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_events_tenant (tenant_id),
  INDEX idx_events_status (tenant_id, status),
  INDEX idx_events_scanner (tenant_id, status, start_at, end_at)
);

1.2 tickets (members-only + holder snapshot)

holder_member_user_id is required

holder_name is required snapshot (denormalized for speed + historical accuracy)

CREATE TABLE tickets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,

  ticket_number INT NOT NULL,
  token_hash CHAR(64) NOT NULL,

  status ENUM('active','void') NOT NULL DEFAULT 'active',

  holder_member_user_id BIGINT NOT NULL,
  holder_name VARCHAR(255) NOT NULL,

  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,

  checked_in_at DATETIME NULL,
  checked_in_by BIGINT NULL,
  checkin_device_id VARCHAR(64) NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_ticket_event_number (event_id, ticket_number),
  UNIQUE KEY uq_ticket_token_hash (token_hash),

  INDEX idx_ticket_member_event (tenant_id, holder_member_user_id, event_id),
  INDEX idx_ticket_event (tenant_id, event_id),
  INDEX idx_ticket_checkin (tenant_id, event_id, checked_in_at),

  CONSTRAINT fk_ticket_event FOREIGN KEY (event_id) REFERENCES events(id),
  CONSTRAINT fk_ticket_holder FOREIGN KEY (holder_member_user_id) REFERENCES users(id)
);

1.3 checkins (audit)
CREATE TABLE checkins (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tenant_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  ticket_id BIGINT NOT NULL,

  scanned_by BIGINT NOT NULL,
  scanned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  device_id VARCHAR(64) NULL,

  result ENUM('checked_in','already_used','invalid','wrong_event','void','expired') NOT NULL,
  note VARCHAR(255) NULL,

  INDEX idx_checkins_event (tenant_id, event_id, scanned_at),
  INDEX idx_checkins_ticket (ticket_id),

  CONSTRAINT fk_checkins_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  CONSTRAINT fk_checkins_event FOREIGN KEY (event_id) REFERENCES events(id)
);

2) QR payload (token format + ticket number)

QR contains no PII:

{ "e": 123, "n": 27, "t": "token_here" }


Encode as base64url string.

Backend stores:

token_hash = SHA256(token) (hex)

3) Core rules (enforced)

Only admins can issue tickets/QR

All members eligible for all events

Max 500 active tickets per member per event

Ticket cannot be voided if checked_in_at IS NOT NULL

No “un-check-in” in MVP

Scanner event list shows only valid events:

published

now >= start_at - 3 hours

and (recommended) now <= end_at + 3 hours (or if end_at null, allow)

4) API endpoints (exact request/response)

All endpoints are tenant-scoped and authenticated.

4.1 Events
List valid scanner events

GET /api/scanner/events
Returns only published events in valid scanning window.

Response:

{
  "now": "2025-12-29T02:10:00.000Z",
  "items": [
    { "eventId": 123, "title": "Fun Run", "startAt": "2026-01-15T01:00:00.000Z", "endAt": "2026-01-15T04:00:00.000Z", "location": "Clubhouse" }
  ]
}


(Behind the scenes: compute now on server, convert for UI display.)

4.2 Admin: ticket issuance
A) Manual issue

POST /api/events/:eventId/tickets/issue

Request:

{ "memberUserId": 555, "quantity": 3 }


Response:

{
  "eventId": 123,
  "memberUserId": 555,
  "holderName": "Juan Dela Cruz",
  "issued": [
    { "ticketId": 1001, "ticketNo": 27, "qrPayload": "base64url..." },
    { "ticketId": 1002, "ticketNo": 28, "qrPayload": "base64url..." },
    { "ticketId": 1003, "ticketNo": 29, "qrPayload": "base64url..." }
  ]
}


Errors:

400 LIMIT_EXCEEDED

404 MEMBER_NOT_FOUND

409 EVENT_NOT_PUBLISHED (optional; you may allow issuing even in draft—your choice)

B) Bulk issue (CSV-driven)

POST /api/events/:eventId/tickets/issue-bulk

Request:

{
  "items": [
    { "memberUserId": 555, "quantity": 2 },
    { "memberUserId": 777, "quantity": 1 }
  ]
}


Response (partial success):

{
  "eventId": 123,
  "results": [
    {
      "memberUserId": 555,
      "holderName": "Juan Dela Cruz",
      "issued": [
        { "ticketId": 1101, "ticketNo": 30, "qrPayload": "..." },
        { "ticketId": 1102, "ticketNo": 31, "qrPayload": "..." }
      ]
    }
  ],
  "errors": [
    { "memberUserId": 888, "error": "LIMIT_EXCEEDED", "message": "Would exceed 500." }
  ]
}

C) Void ticket (only if not checked in)

POST /api/events/:eventId/tickets/:ticketId/void

Response:

{ "ticketId": 1001, "status": "void" }


Errors:

409 ALREADY_CHECKED_IN (must block)

404 NOT_FOUND

D) List tickets (admin)

GET /api/events/:eventId/tickets?view=tickets&search=juan&checkedIn=any&status=any&page=1

Response:

{
  "items": [
    {
      "ticketId": 1001,
      "ticketNo": 27,
      "holderMemberUserId": 555,
      "holderName": "Juan Dela Cruz",
      "status": "active",
      "checkedInAt": null
    }
  ],
  "page": 1,
  "pageSize": 50,
  "total": 1200
}

4.3 Scanner: preview + confirm
A) Scan preview (show name)

POST /api/events/:eventId/tickets/scan-preview

Request:

{ "token": "8f3a...", "ticketNo": 27 }


Response (valid):

{
  "status": "valid",
  "ticketId": 1001,
  "ticketNo": 27,
  "holder": { "userId": 555, "name": "Juan Dela Cruz" },
  "checkedInAt": null
}


Response (already used):

{
  "status": "already_used",
  "ticketId": 1001,
  "ticketNo": 27,
  "holder": { "userId": 555, "name": "Juan Dela Cruz" },
  "checkedInAt": "2025-12-28T06:21:00.000Z"
}


Response (void/invalid/wrong event):

{ "status": "void" }

{ "status": "invalid" }

{ "status": "wrong_event" }

B) Confirm check-in (atomic)

POST /api/events/:eventId/tickets/checkin

Request:

{ "token": "8f3a...", "deviceId": "gateA-iphone12" }


Response:

{
  "status": "checked_in",
  "ticketId": 1001,
  "ticketNo": 27,
  "holder": { "userId": 555, "name": "Juan Dela Cruz" },
  "checkedInAt": "2025-12-29T02:15:00.000Z"
}

4.4 Analytics (admin)
A) Summary

GET /api/events/:eventId/analytics/summary

Response:

{
  "eventId": 123,

  "tickets": {
    "issuedActive": 1200,
    "voided": 12,
    "checkedInTickets": 980,
    "checkInRate": 0.8167
  },

  "participants": {
    "uniqueMembersWithTickets": 850,
    "uniqueMembersCheckedIn": 720,
    "totalEntriesCheckedIn": 980,
    "ticketsPerCheckedInMember": {
      "avg": 1.36,
      "min": 1,
      "max": 10
    }
  },

  "byGate": [
    { "deviceId": "gateA-iphone12", "checkedInTickets": 420 },
    { "deviceId": "gateB-android", "checkedInTickets": 560 }
  ]
}

B) Check-in timeseries

GET /api/events/:eventId/analytics/timeseries?bucket=5m
Response:

{
  "bucket": "5m",
  "points": [
    { "time": "2026-01-15T01:00:00.000Z", "checkedInTickets": 22 },
    { "time": "2026-01-15T01:05:00.000Z", "checkedInTickets": 35 }
  ]
}

C) Participants list (unique vs tickets)

GET /api/events/:eventId/participants?view=unique&checkedIn=any&search=juan&page=1

Response:

{
  "items": [
    {
      "memberUserId": 555,
      "name": "Juan Dela Cruz",
      "ticketsIssuedActive": 3,
      "ticketsCheckedIn": 1,
      "firstCheckInAt": "2026-01-15T01:20:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 50,
  "total": 850
}

5) Frontend flows (React + TS)
5.1 Admin: ticket creation (manual + bulk CSV)

Location: Admin → Events → Event Detail → Tickets tab

Manual issue UI

Components:

Member search picker (name/email)

Quantity input

“Issue Tickets” button

Result list modal/table with generated ticketNos + download links

Flow:

select member

fetch active ticket count (optional enhancement):

GET /events/:eventId/members/:memberUserId/ticket-count

input quantity

submit to /tickets/issue

show issued tickets:

each row has Ticket # + Download QR

Download QR:

Render QR in browser canvas and download PNG

Also allow “Download all issued” (Phase 2 zip)

Bulk CSV UI

CSV columns (recommended): memberUserId,quantity
Flow:

upload CSV

parse and preview rows

validate numeric quantity > 0

submit to /tickets/issue-bulk

show:

success section (by member)

error section (with reasons)

allow re-download “errors.csv” (nice-to-have)

Ticket table UI (admin operations)

Columns:

Ticket #

Member name

Status (active/void)

Checked-in at

Actions:

Download QR

Void (only if active and not checked in)

Void action:

button disabled if checkedInAt != null

backend enforces 409 ALREADY_CHECKED_IN

5.2 Admin: analytics

Location: Admin → Events → Event Detail → Analytics tab

Summary cards

Active issued

Checked-in tickets (entries)

Unique members checked in

Check-in rate

Charts

check-ins over time (5 min buckets)

Tables

Gates table (deviceId → checked-in tickets)

Participants table (unique view)

filters: checked-in / not checked-in / all

search

pagination

export CSV

5.3 Scanner: preview + confirm

Location: /scanner (role: STAFF_SCANNER)

Event selection screen

call GET /api/scanner/events

show only valid events based on 3-hour rule

staff selects event, then “Start scanning”

Scan screen

camera scan

on scan:

decode QR payload

if payload.e != selected event → show “wrong event”

call preview

result card shows:

Name (largest)

Ticket #

Status

Confirm button (only if valid)

Confirm:

calls /tickets/checkin

shows checked-in time

“Scan Next” resets state and resumes camera

Device ID:

set in a small settings panel once (saved to localStorage)

6) Alignment with invite onboarding + email reset

Staff accounts are created via invite links

Password reset uses email reset tokens

Scanner and admin pages use the same auth/tenant model as the portal