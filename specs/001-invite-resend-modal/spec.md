# Feature Specification: Invite Resend Modal

**Feature Branch**: `[001-invite-resend-modal]`  
**Created**: 2026-01-04  
**Status**: Draft  
**Input**: User description: "in the user table show the full name and the email of the user. resend invite button should be visible. when resend button is click a modal pops up and will show the invitation link that admin can copy and a button to resend the invite."

## Clarifications

### Session 2026-01-04

- Q: How should the invitation link be presented inside the modal to balance quick sharing and security concerns? → A: Always display the full invitation URL inline (read-only) next to the copy control.
- Q: Which delivery channels should a resend use? → A: Mirror the original invitation’s channel(s): email-only invites resend via email, dual-channel invites resend through both.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Identify invited users quickly (Priority: P1)

Admin views the Invited tab of User Management and immediately sees each invitee's full name, email, and a clearly labeled Resend Invite action within the table.

**Why this priority**: Without accurate identity data and an obvious action entry point, admins cannot confidently trigger subsequent outreach, blocking invite completion workflows.

**Independent Test**: Load the Invited tab with sample invitees and verify that every row renders name, email, status, and the Resend Invite control without navigating elsewhere.

**Acceptance Scenarios**:

1. **Given** an admin on the Invited tab, **When** the table loads, **Then** every invitee row displays full name and primary email without truncation.
2. **Given** an invited user who is eligible for reminders, **When** the admin hovers or focuses on the row, **Then** the Resend Invite button remains visible and enabled.

---

### User Story 2 - Resend invite with contextual modal (Priority: P2)

Admin selects Resend Invite and a modal surfaces the invitation link, reminder metadata (sent date, last sent date, reminder count, inviter), and actions to copy or resend from the same surface.

**Why this priority**: Providing all invite context within the modal reduces errors, eliminates back-and-forth navigation, and enables quick manual sharing when automated delivery fails.

**Independent Test**: Trigger the modal for a sample invitee and confirm that link visibility, copy interaction, and resend confirmation can be tested end-to-end without leaving the modal.

**Acceptance Scenarios**:

1. **Given** the modal is open, **When** the admin clicks Copy Invite Link, **Then** the link is copied to the clipboard and a toast confirms success.
2. **Given** the modal is open, **When** the admin selects Resend Invite, **Then** the system dispatches a reminder email and updates the reminder count in real time within the modal.

---

### User Story 3 - Guardrails and audit trail (Priority: P3)

Admin receives immediate feedback if the invite has already been accepted, revoked, or exceeded reminder caps, and every resend attempt is logged for compliance review.

**Why this priority**: Guardrails prevent spam, uphold reminder policies, and provide traceability when multiple admins manage the same invitee cohort.

**Independent Test**: Simulate invitees in blocked states (activated, revoked, over cap) and verify that buttons disable with explanatory messaging while audit events capture who attempted the resend.

**Acceptance Scenarios**:

1. **Given** an invitee who has already activated their account, **When** an admin opens the modal, **Then** the resend action is disabled and the modal states the date of activation.
2. **Given** an admin triggers a resend, **When** the action succeeds, **Then** an audit log entry records admin ID, timestamp, invitee ID, and channel used.

### Edge Cases

- Invitee record lacks a stored first or last name → show "Name unavailable" placeholder yet keep resend action available.
- Invite link is expired when modal opens → regenerate a fresh link before displaying copy/resend controls and notify admin.
- Reminder cap already reached → disable resend button and surface when the next reminder window opens.
- Admin attempts resend while user status changed to Active during modal session → refresh status in modal and block resend.
- Network or mail service failure during resend → keep modal open, present explicit failure reason, and allow retry once issue clears.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Invited tab MUST display full name and primary email columns for every invitee row, sourcing data from the current user profile or invitation payload.
- **FR-002**: A Resend Invite button MUST render in each row for invitees whose status is Invited, Pending, or Reminder-Eligible and remain hidden for Activated, Revoked, or Deleted users.
- **FR-003**: Selecting Resend Invite MUST open a modal populated with invitee metadata (full name, email, current status, sent date, last sent date, reminder count, and inviter name).
- **FR-004**: The modal MUST show the active invitation link in a read-only field that always displays the full URL alongside a Copy control that confirms success/failure without closing the modal.
- **FR-005**: The modal MUST provide a Resend Invite call-to-action that dispatches the standard invite template through the same channel(s) used originally (email-only stays email; dual-channel triggers both), updates reminder count, and surfaces success messaging within three seconds of mailer confirmation.
- **FR-006**: When reminder caps are reached (assumed three reminders per invitee unless configured otherwise), the system MUST disable resend actions, show the next available resend time, and prevent manual overrides.
- **FR-007**: Every resend attempt MUST be logged with admin ID, invitee ID, timestamp, channel, and success/failure outcome for audit retrieval.
- **FR-008**: If the invite has been activated or revoked while the modal is open, the system MUST refresh state, disable actions, and guide the admin to the appropriate follow-up (e.g., view user profile instead).

### Key Entities *(include if feature involves data)*

- **InvitedUser**: Represents a person who has been invited but not fully onboarded; attributes include full name, email, status, inviter ID, sent date, last sent date, reminder count, and associated organization.
- **InvitationLifecycle**: Tracks each invite link instance and resend event; attributes include invitation token, channel, expiration timestamp, delivery status, send count, and audit metadata (admin actor, reason).

### Assumptions

- Reminder caps remain aligned with current policy (three automated reminders per invitee) and configuration changes will be handled elsewhere.
- Existing invitation templates, delivery channels, and authentication flows remain unchanged; this feature only exposes controls and metadata.
- Clipboard copy feedback leverages the platform's existing toast/notification pattern to avoid net-new UI components.

### Non-Functional Requirements

- **NFR-001**: The Invited tab API + UI must render eligible invitees (500-row sample) in under 1.5 seconds at the 95th percentile; table payload queries require pagination safeguards.
- **NFR-002**: Opening the Resend Invite modal must complete in under 300 ms, and the resend workflow (button click → toast confirmation) must finish within 3 seconds, measured from transactional provider acknowledgement.
- **NFR-003**: Resend endpoints are limited to five attempts per admin per minute; exceeding this threshold must return a rate-limit error without invoking the mail provider.
- **NFR-004**: Audit log writes for resend attempts must occur within 50 ms of mail provider response and logs must retain data for at least one year with invite URLs redacted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of invitee rows on the Invited tab display both full name and primary email in usability tests with production-like data.
- **SC-002**: Trained admins can complete the “open modal, copy link, resend invite” flow in under 15 seconds in 90% of observed sessions.
- **SC-003**: Reminder delivery success rate for eligible invitees reaches at least 95% on the first resend attempt, as measured by delivery status events.
- **SC-004**: Support tickets related to “cannot find resend invite” drop by 80% within one release cycle of launch.

