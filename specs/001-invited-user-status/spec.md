# Feature Specification: Invited Users Status Visibility

**Feature Branch**: `[001-invited-user-status]`  
**Created**: January 4, 2026  
**Status**: Draft  
**Input**: User description: "for user management, invited user should show up in the user management page with the invited status."

## Clarifications

### Session 2026-01-04

- Q: Should invited users appear in the primary list by default or under a dedicated view? → A: Default to a dedicated `Invited` tab/pill separate from Active/Inactive lists.
- Q: How should testing be handled for this feature slice? → A: Defer automated Jest/Vitest work and rely on documented manual QA for the MVP release.
- Q: Do statuses need to auto-refresh without user action? → A: No—admins can refresh the page manually to pull the latest lifecycle states.

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

### User Story 1 - Track Pending Invites (Priority: P1)

Events or billing admins need to see every person they have invited so they can verify that outstanding invitations are still pending and follow up if needed.

**Why this priority**: Without visibility into pending invitations, admins cannot tell whether outreach tasks are complete, which blocks onboarding.

**Independent Test**: Load the user management page using only seeded invitation records and confirm admins can view pending invitees without enabling other modules.

**Acceptance Scenarios**:

1. **Given** an invite has been sent to an email address, **When** an admin opens the user management page, **Then** that invitee appears in the table with status `Invited` even if they have not completed registration.
2. **Given** an invitee completes registration, **When** the admin refreshes the page, **Then** the status automatically transitions from `Invited` to the user's assigned role status and is removed from the pending invite list.

---

### User Story 2 - Filter for Invited Users (Priority: P2)

Admins need to quickly isolate invitees or switch back to active users via tabs or filters so they can manage different cohorts without losing context.

**Why this priority**: Dedicated navigation prevents errors when multiple status types share the same table and keeps follow-up work efficient.

**Independent Test**: Enable only the tabbed navigation and verify that switching between `Invited` and other status views returns the correct subset, independent from other enhancement stories.

**Acceptance Scenarios**:

1. **Given** the default view opens to the `Invited` tab, **When** an admin selects the `Active` tab, **Then** the grid refreshes to show only active users while preserving the invitation tab for later use.
2. **Given** the admin returns to the `Invited` tab, **When** the view loads, **Then** only invitees remain in the grid along with their metadata and previously applied invite-specific filters.

---

### User Story 3 - Audit Invitation Details (Priority: P3)

Super admins need a concise view of when invitations were sent, by whom, and whether they expired so they can troubleshoot onboarding issues with support.

**Why this priority**: Invitation metadata enables accountability and accelerates resolution of "missing invite" tickets.

**Independent Test**: With only invitation data populated, confirm the page exposes invitation timestamps and inviter info without relying on any mail or notification systems.

**Acceptance Scenarios**:

1. **Given** an invitation was issued more than 14 days ago, **When** the admin reviews the invite row, **Then** they can see the sent date and whether it has expired or needs resending.
2. **Given** multiple admins send invites to the same organization, **When** a super admin inspects a row, **Then** the inviter's name or role is visible so responsibility is clear.

### Edge Cases

- Duplicate invitations for the same email must either merge into a single row or clearly show the most recent invite so admins do not double-count people.
- Invitations that expire or are manually revoked must still appear with an `Expired` or `Revoked` badge until the admin dismisses them.
- Invitees without completed profiles (no full name yet) should display the invitation email plus placeholder text so the table remains readable.
- If an invitation is sent to an address that later belongs to a deactivated user, the system must prevent conflicting status displays.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The user management table MUST display a row for every outstanding invitation with columns for email, placeholder name (if provided), role, status `Invited`, invitation date, and inviter.
- **FR-002**: Status badges MUST show `Invited` until the invitee completes registration, after which the backend exposes the updated lifecycle state and the UI reflects it on the next fetch or manual page refresh—no background polling required.
- **FR-003**: The status filter, tabs, and search controls MUST support selecting the dedicated `Invited` view so admins can isolate pending invitees without mixing them with active or inactive accounts.
- **FR-004**: Invitation rows MUST include lifecycle metadata (sent date, expiration date, number of reminders sent) accessible from the grid or a quick-view panel to support follow-up actions.
- **FR-005**: When an invitation expires, is rescinded, or is accepted, the backend MUST update the stored lifecycle metadata immediately so that the new state surfaces as soon as an admin refreshes or reopens the user management page.
- **FR-006**: If an invitee already exists as a deactivated user, the system MUST prevent duplicate active records by linking the invitation to the existing profile and flagging the conflict in the status column.
- **FR-008**: The invitation workflow MUST enforce email-level deduplication by merging or superseding prior pending invites and clearly indicating conflict states (e.g., duplicate email, linked deactivated user) in the admin UI.
- **FR-007**: The user management page MUST default to the `Invited` tab/pill on load, while providing adjacent tabs for Active, Inactive, and other statuses.

### Key Entities *(include if feature involves data)*

- **UserInvitation**: Represents an invitation issued to an email address, capturing inviter, intended role, invitation timestamp, expiration timestamp, reminder count, and current invitation status (`Invited`, `Expired`, `Revoked`, `Accepted`).
- **UserManagementRow**: The table representation that merges User or UserInvitation data, ensuring each row shows name/email, role, status, joined date (or `Pending`), and last login (blank for invitees) so admins see a unified list.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of lifecycle changes (new invites, acceptances, expirations, revocations) appear correctly after a manual page refresh or table refetch, ensuring admins can always trust the view they explicitly reload.
- **SC-002**: Admins can filter for `Invited` users and receive the correct result set in under 3 seconds for datasets up to 5,000 accounts.
- **SC-003**: At least 95% of support tickets about "missing invited users" are resolved without engineering intervention because admins can self-serve from the table within one business day of launch.
- **SC-004**: Super admins report (via internal survey) that they can identify the inviter and invitation age for 90% of invitees without leaving the user management page.

## Assumptions

- Invitations are already persisted elsewhere in the system, and this feature surfaces them without redefining the invitation workflow.
- Admin-level roles (events admin, billing admin, super admin) have permission to view invitation metadata; guests and end users do not access the user management table.
- User management page loads the dedicated `Invited` tab by default while allowing admins to switch to Active or Inactive tabs without page reloads.
- Invitation expiration is set by existing business rules (14 days unless configured) and will be reused for the status badges shown here.
- Joined date and last login values remain blank or display `—` until the invitee completes onboarding.
