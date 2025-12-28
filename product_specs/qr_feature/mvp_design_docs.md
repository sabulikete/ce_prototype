Scope: QR-code based event entry as a module inside the existing Member Portal.

1. Goals

Admin can create/manage events and issue QR tickets to portal members.

Staff can scan QR codes at gates, validate identity (name shown), and check in tickets.

System supports multi-tenant SaaS operation.

Admin can view analytics (attendance, check-ins, participant lists, device/gate breakdown, and time-series).

2. Tech Stack (Aligned with Member Portal)

Frontend: React + TypeScript

Backend: Node.js + Express + TypeScript

Database: MySQL

Auth: Same portal auth (roles enforced server-side)

Account onboarding: Invite links

Password reset: Email-based reset

3. Roles & Permissions

TENANT_ADMIN

Create/update events

Publish/archive events

Pin/unpin events

Issue tickets (manual + bulk CSV)

Void tickets (only if NOT checked in)

View analytics, participants, and exports

Invite staff

STAFF_SCANNER

View valid events list in scanner

Scan → preview ticket identity/status

Confirm check-in

MEMBER (all portal members, includes admins as members)

View published events

View own tickets/QRs

4. Content & Event Rules
4.1 Event Fields

Title

Description (optional)

Location (optional)

Start datetime (start_at)

End datetime (end_at) (optional but recommended)

4.2 Event Status

draft: visible to admins only

published: visible to all portal members

archived: read-only historical view

4.3 Pinning

Events can be pinned (is_pinned) for higher prominence in listings.

5. Ticket Model
5.1 Member-only Tickets

Only admins can issue tickets.

Only portal members can hold tickets (no guests).

A member can hold multiple tickets per event, max 500 active tickets per member per event.

5.2 Ticket Numbering

Each event has sequential ticket_number starting at 1.

Ticket numbers increment by 1 for each newly issued ticket.

Ticket numbers are global per event (not per member).

5.3 Ticket Status

active — valid

void — invalid

Rules:

Ticket cannot be voided after it has been checked in.

Admins cannot un-check-in a ticket in MVP.

5.4 QR Payload

QR code uses token format + ticket number (no PII).

Payload (JSON compact):

{ "e": 123, "n": 27, "t": "<token>" }

Encode as base64url.

Store only SHA-256(token) as token_hash.

6. Scanning Rules
6.1 Internet Requirement

Internet is required for scanning (server-verified identity & status).

6.2 Multi-gate / Multi-device

Multiple devices can scan simultaneously.

Each device sends deviceId with check-in to support gate analytics.

6.3 Valid Events Filter (Scanner Dropdown)

Scanner should list only events that are:

status = published

now >= start_at - 3 hours

and scanning remains available until end_at + 3 hours (if end_at is null, scanning continues after start)

7. Scan UX Flow (2-step)

Scan QR

Preview (server call)

Show member name + ticket # + status

Staff visually validates the person

Confirm Check-in (server call)

Reason: Prevents mistaken check-ins and supports identity matching.

8. Analytics (Admin)

Analytics must display both ticket-level and member-level metrics.

8.1 Definitions (Locked)

Tickets issued (active): all tickets created excluding voided (status='active')

Tickets voided: status='void'

Tickets checked in: checked_in_at IS NOT NULL

Total entries: same as tickets checked in

Unique participants (issued): distinct members with ≥1 active ticket

Unique participants (checked in): distinct members with ≥1 checked-in ticket

8.2 Required Metrics

Per event:

Tickets issued (active)

Tickets voided

Tickets checked in (total entries)

Check-in rate (checked-in tickets / active issued)

Unique participants issued

Unique participants checked in

Tickets per checked-in member (min/avg/max)

Check-ins over time (time-series buckets)

Check-ins by gate/device (deviceId)

(Optional) check-ins by scanner user

8.3 Participants Lists

Unique view (default): one row per member with counts

Tickets view: one row per ticket for audit/ops

Export to CSV (unique view minimum)

9. Non-functional Requirements

Tenant isolation: every DB query scoped by tenant_id.

Security: never store raw tokens; no PII in QR.

Atomic check-in: prevent double-use using guarded update.

Rate limiting: login/reset/invite; light rate limit for scan endpoints.

Backups: daily DB backups + retention (7–30 days).

Timestamps: store in UTC; display in Asia/Manila.

10. Out of Scope (MVP)

Offline scanning mode

Ticket purchase/payment flow

Un-check-in / check-in reversal

Bulk QR ZIP export (nice-to-have)

Advanced segmentation/group eligibility