# Feature Specification: Memorandum Post Type

**Feature Branch**: `001-memorandum-post-type`  
**Created**: 2026-01-04  
**Status**: Draft  
**Input**: User description: "Change the post to memorandum type in the content page. when memorandum type is selected it will automatically be member only so the visibility drop down will be disabled and contains member only as default."

## Clarifications

### Session 2026-01-04
- Q: Where to enforce "member-only" for Memorandum posts? → A: Server-side authorization and route protection (mirror events/announcements).
- Q: Error response for unauthorized Memorandum access → A: 404 Not Found.
- Q: Canonical type naming → A: Backend enum `MEMO`; UI displays label "Memorandum".

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

### User Story 1 - Select Memorandum Type (Priority: P1)

As an Admin, I want to set a post’s type to "Memorandum" and have visibility automatically set to "Member Only" with the visibility control disabled, so that sensitive communications remain restricted without extra steps.

**Why this priority**: Ensures confidentiality and reduces mistakes by enforcing correct visibility for memorandum posts.

**Independent Test**: Can be tested by creating/editing a post, selecting "Memorandum" type, and verifying visibility is auto-set and disabled.

**Acceptance Scenarios**:

1. **Given** I am on the Content page creating a post, **When** I select Type = "Memorandum", **Then** the Visibility field is immediately set to "Member Only" and becomes disabled.
2. **Given** a post with Type = "Memorandum", **When** I try to change Visibility, **Then** the control is disabled and cannot be altered.
3. **Given** a post with Type ≠ "Memorandum", **When** I view the Visibility field, **Then** the control is enabled and behaves normally according to existing rules.

---

### User Story 2 - Update Existing Posts (Priority: P2)

As an Admin, I want existing posts updated to "Memorandum" to immediately enforce "Member Only" visibility, so that legacy content respects the new confidentiality rules.

**Why this priority**: Prevents leakage from legacy content when changing type after publication.

**Independent Test**: Can be tested by editing an existing non-memorandum post, changing Type to "Memorandum", and verifying visibility auto-updates and locks.

**Acceptance Scenarios**:

1. **Given** an existing post of any non-memorandum type, **When** I change Type to "Memorandum", **Then** Visibility updates to "Member Only" and becomes disabled.
2. **Given** an existing post previously set to "Memorandum", **When** I change Type to a non-memorandum type, **Then** the Visibility control is re-enabled and restores the last non-memorandum visibility selection (or defaults to "Public" if none exists).

---

### User Story 3 - Audience Enforcement (Priority: P3)

As a Member, I want memorandum posts to be viewable to authenticated members only, so that restricted content remains private to the community.

**Why this priority**: Protects sensitive information and aligns with membership expectations.

**Independent Test**: Can be tested by attempting to view a memorandum post as a guest vs. as a logged-in member.

**Acceptance Scenarios**:

1. **Given** I am a Guest (not logged in), **When** I attempt to view a memorandum post, **Then** I am blocked and see a friendly message indicating member-only content.
2. **Given** I am a logged-in Member, **When** I open a memorandum post, **Then** the content displays normally.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- Switching type rapidly: UI state consistently enforces visibility rules for "Memorandum" without flicker or race conditions.
- Restoring visibility: When changing from "Memorandum" back to other types, the system restores the last non-memorandum visibility selection, or defaults to "Public" if not previously set.
- Draft vs. published: Rules apply equally whether the post is draft or published (visibility remains member-only when "Memorandum").

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The Content page MUST provide a Post Type control that includes "Memorandum" as a selectable type.
- **FR-002**: When Type = "Memorandum" is selected, the system MUST automatically set Visibility to "Member Only".
- **FR-003**: When Type = "Memorandum" is selected, the Visibility control MUST be disabled (read-only) to prevent changes.
- **FR-004**: For posts already saved, changing Type to "Memorandum" MUST immediately enforce "Member Only" visibility and disable the control.
- **FR-005**: When changing Type from "Memorandum" to a non-memorandum type, the system MUST re-enable the Visibility control and restore the last non-memorandum visibility selection; if none exists, default to "Public".
- **FR-006**: Audience enforcement MUST ensure that Guests cannot view memorandum posts, while Members can.
- **FR-007**: The UI MUST display an informative note near the Visibility control indicating "Memorandum posts are member-only" when Type = "Memorandum".
- **FR-008**: The system MUST persist the enforced visibility rules consistently across create, edit, and view flows.
- **FR-009**: Server-side MUST enforce member-only access for Memorandum posts on content list and detail APIs (e.g., `/api/content`, `/api/content/:id`), consistent with existing events/announcements behavior.
- **FR-010**: Unauthorized guest access to Memorandum content MUST return `404 Not Found`; authenticated non-members SHOULD receive `404` as well to avoid content enumeration.
- **FR-011**: The backend MUST represent Memorandum type using `ContentType.MEMO` (existing enum), while the UI MUST display the human-readable label "Memorandum".

### Key Entities *(include if feature involves data)*

- **Post**: Title, Body, Type (e.g., Announcement, Event Update, Memorandum/`MEMO`), Visibility (e.g., Public, Member Only), Status (Draft/Published), Timestamps.
- **Audience**: Member (authenticated), Guest (unauthenticated).

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Admins can set a post to "Memorandum" and see Visibility auto-adjust and disabled within 1 second of selection.
- **SC-002**: 0% of Guests can access memorandum posts; access attempts show a friendly member-only message.
  - Error code behavior: Unauthorized guest access to memorandum content returns 404 Not Found.
- **SC-003**: 95% of admins complete memorandum configuration without confusion in a usability test (no attempts to change disabled visibility).
- **SC-004**: Visibility restoration on reverting from "Memorandum" occurs consistently, with no more than 1 additional click required to confirm desired visibility.

## Assumptions

- "Member Only" means accessible exclusively to authenticated members; admins and staff are treated as members or otherwise already authorized for admin UI.
- Visibility options for non-memorandum types include "Public" and potentially other scoped audiences per existing rules; default fallback is "Public".
- The Content page already supports editing Type and Visibility fields; this feature adds rules to orchestrate their interaction.
