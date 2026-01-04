# Feature Specification: Ticket Issuance

**Feature Branch**: `001-ticket-issuance`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "Ticket Issuance: Users can purchase multiple tickets (cap 50). Cap is configurable. Cumulative purchases allowed. Invited users can have tickets issued but view QR only after activation."

## Clarifications

### Session 2026-01-04
- Q: Should the system enforce a global event capacity limit in addition to the per-user cap? → A: Yes. Check global event capacity first (default 1000), then user cap.
- Q: Can admins override the per-user ticket cap (50)? → A: No. Admins are bound by the same cap to ensure data consistency.
- Q: Should the system send an email notification to "Invited" users when tickets are issued? → A: No. Silent issuance; tickets appear upon activation.
- Q: Does the system support multiple ticket types (VIP, General) or just a single type? → A: Single "Standard" type only for MVP.
- Q: Should ticket issuance be blocked for users with status other than Active or Invited (e.g., Suspended)? → A: Yes. Only Active or Invited users can receive tickets.

## Definitions

*   **Invited User**: A record in users with `status = INVITED` (pre-activation). Tickets can be issued to this `userId`.
*   **Counted Ticket**: Any ticket for `(userId, eventId)` whose `status != VOIDED`. Voided tickets do not count toward the cap.
*   **Cap**: Configurable constant `MAX_TICKETS_PER_USER_PER_EVENT` (default 50).
*   **Global Event Capacity**: Maximum total tickets allowed for an event. Default: 1000.
*   **Cap Rule (Partial Fulfillment)**: When a request exceeds the remaining capacity (either User Cap or Global Event Capacity), the system partially fulfills:
    *   `userRemaining = userCap - userCountedTickets`
    *   `globalRemaining = globalCapacity - totalEventTickets`
    *   `remaining = min(userRemaining, globalRemaining)`
    *   `issued = min(requested, remaining)`
    *   If `issued < requested` → return `capReached=true` and `notIssued = requested - issued`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Issue Multiple Tickets (Priority: P1)

As an admin, I want to issue multiple tickets to a specific user so that I can distribute tickets manually.

**Why this priority**: Core functionality.

**Independent Test**: Admin requests N tickets for User U where N <= Cap.

**Acceptance Scenarios**:

1.  **Issue within cap**:
    *   **Given** user has N counted tickets for event E
    *   **When** admin requests K tickets for the user and N+K ≤ cap
    *   **Then** issue K tickets; total counted becomes N+K

### User Story 2 - Partial Fulfillment (Priority: P1)

As a user, if I request more tickets than allowed, I want to receive as many as possible up to the cap rather than being rejected entirely.

**Why this priority**: Better UX than hard rejection; maximizes ticket distribution.

**Independent Test**: Request tickets that would exceed the cumulative cap.

**Acceptance Scenarios**:

1.  **Partial fulfill when exceeding cap**:
    *   **Given** user has N counted tickets for event E
    *   **When** they request K and N+K > cap
    *   **Then** issue `cap - N` tickets, return issued vs requested counts, and set `capReached=true`

### User Story 3 - Voided Tickets Exclusion (Priority: P2)

As a user, I want voided tickets to be excluded from my cap count so that I can replace cancelled tickets.

**Why this priority**: Ensures fairness and correct enforcement of limits.

**Independent Test**: Void a ticket and verify cap calculation.

**Acceptance Scenarios**:

1.  **Voided tickets don't count**:
    *   **Given** user has X tickets where V are VOIDED
    *   **When** checking cap
    *   **Then** counted = X - V

### User Story 4 - Invited User Issuance & Activation (Priority: P2)

As an admin, I want to issue tickets to invited users that become fully visible upon activation.

**Why this priority**: Supports pre-onboarding workflows.

**Independent Test**: Issue to invited user, then activate user.

**Acceptance Scenarios**:

1.  **Issue to invited user**:
    *   **Given** user `status=INVITED`
    *   **When** tickets are issued
    *   **Then** tickets are created and linked to `userId`, but the API returns `code: null` for these tickets until activation. No email notification is sent.
2.  **Activation unlocks QR view**:
    *   **Given** user `status=INVITED` with issued tickets
    *   **When** user becomes `ACTIVE`
    *   **Then** QR codes are visible without changing ticket ownership

### User Story 5 - Concurrency Handling (Priority: P1)

As a system, I need to enforce caps correctly even when multiple requests happen simultaneously.

**Why this priority**: Prevents exploitation of the cap limit.

**Independent Test**: Simulate concurrent requests for the same user/event.

**Acceptance Scenarios**:

1.  **Concurrency**:
    *   **Given** two issuance requests occur concurrently
    *   **Then** cap is still enforced and total counted never exceeds cap

## Functional Requirements *(mandatory)*

*   **FR-TIX-001**: Issue multiple tickets in one request.
*   **FR-TIX-002**: Enforce cap per user per event using counted tickets (VOIDED excluded). Applies to ALL roles including Admins.
*   **FR-TIX-003**: If request exceeds cap, partially fulfill up to cap and return issued/requested counts + `capReached` flag.
*   **FR-TIX-004**: Cumulative issuance adds to existing tickets.
*   **FR-TIX-005**: Support issuance to `users.status=INVITED`; QR visible only after activation.
*   **FR-TIX-006**: Enforce cap atomically under concurrency.
*   **FR-TIX-007**: Admin-Only Issuance: Only users with ADMIN or STAFF role can issue tickets. Self-service purchase is NOT supported in this MVP.
*   **FR-TIX-008**: Enforce global event capacity (default 1000). Reject or partially fulfill requests that exceed total event availability.
*   **FR-TIX-009**: Silent Issuance for Invited Users: Do not trigger email notifications when tickets are issued to users with status=INVITED.
*   **FR-TIX-010**: Single Ticket Type: All issued tickets are of type "Standard". No support for multiple tiers (VIP, etc.) in this iteration.
*   **FR-TIX-011**: User Status Validation: Restrict ticket issuance to users with status `ACTIVE` or `INVITED`. Reject requests for other statuses (e.g., `SUSPENDED`).

## Success Criteria *(mandatory)*

*   **Quantitative**:
    *   100% of valid requests within cap are fulfilled.
    *   100% of requests exceeding cap are partially fulfilled correctly (total never > 50).
    *   Concurrent requests never result in total tickets > Cap.
*   **Qualitative**:
    *   Invited users can seamlessly access tickets upon activation.

## Assumptions & Dependencies *(optional)*

*   **Assumption**: "Purchase" currently means free issuance (FR-TIX-007).
*   **Dependency**: User status model (INVITED vs ACTIVE) exists.
*   **Dependency**: Ticket model supports status (VALID vs VOIDED).

## Technical Considerations *(optional)*

*   **Concurrency**: Use database transactions or atomic increments/checks to handle FR-TIX-006.
*   **Configuration**: `MAX_TICKETS_PER_USER_PER_EVENT` should be easily configurable.
*   **Global Cap**: Default `MAX_TICKETS_PER_EVENT = 1000`. Configurable per event in future.
