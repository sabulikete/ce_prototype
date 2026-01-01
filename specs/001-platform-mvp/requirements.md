# Functional Requirements

**Feature**: Member Portal Platform MVP

## 1. Public Website

### Functional Requirements
- **REQ-PUB-01**: Display list of published, public content (Announcements, Events, Memos, Activities).
- **REQ-PUB-02**: Support filtering by content type.
- **REQ-PUB-03**: Respect "Pinned" status (pinned items appear first).
- **REQ-PUB-04**: View details of a single content item.
- **REQ-PUB-05**: Redirect to login for member-only content.

### User Stories
- **US-PUB-1**: As a Guest, I want to see upcoming public events so I can attend them.
- **US-PUB-2**: As a Guest, I want to read public announcements to stay informed.

## 2. Member Portal

### Functional Requirements
- **REQ-MEM-01**: Secure login via email/password.
- **REQ-MEM-02**: View all published content (Public + Member-Only).
- **REQ-MEM-03**: View personal dashboard with recent relevant content.
- **REQ-MEM-04**: View list of assigned tickets for upcoming events.
- **REQ-MEM-05**: View personal billing statements within the visible window.
- **REQ-MEM-06**: Password reset flow (request link -> email -> reset form).

### User Stories
- **US-MEM-1**: As a Member, I want to log in to see private memos.
- **US-MEM-2**: As a Member, I want to view my latest billing statement.
- **US-MEM-3**: As a Member, I want to access my QR ticket for tonight's event.

## 3. Admin Dashboard (Content & Users)

### Functional Requirements
- **REQ-ADM-01**: CRUD operations for all content types.
- **REQ-ADM-02**: Manage content lifecycle (Draft -> Published -> Archived).
- **REQ-ADM-03**: Toggle "Pinned" status on published content.
- **REQ-ADM-04**: Generate single-use invite links for new users.
- **REQ-ADM-05**: Revoke/Suspend user access.
- **REQ-ADM-06**: View audit logs for critical actions (optional for MVP, but data must be captured).

### User Stories
- **US-ADM-1**: As an Admin, I want to draft an announcement and publish it later.
- **US-ADM-2**: As an Admin, I want to invite a new resident by generating a link.

## 4. Events & Ticketing

### Functional Requirements
- **REQ-EVT-01**: Create events with Start Date (required), End Date (optional), Location (optional).
- **REQ-EVT-02**: Issue tickets to specific members for an event.
- **REQ-EVT-03**: Generate unique, signed QR codes for each ticket.
- **REQ-EVT-04**: Void tickets (only possible *before* check-in).
- **REQ-EVT-05**: Staff scanning interface: Select event -> Scan QR -> Validate.
- **REQ-EVT-06**: Validation Logic:
    - Must be valid signature.
    - Must be for the selected event.
    - Must not be previously checked in.
    - Must be within scanning window (Start - 3h to End + 3h).
- **REQ-EVT-07**: Atomic check-in to prevent double usage.

### User Stories
- **US-STF-1**: As Staff, I want to scan a ticket and get an immediate "Valid/Invalid" result.
- **US-ADM-3**: As an Admin, I want to issue tickets to all board members for the gala.

## 5. Billing Statements

### Functional Requirements
- **REQ-BIL-01**: Upload single PDF statement for a member.
- **REQ-BIL-02**: List statements for a member with "Month/Year" metadata.
- **REQ-BIL-03**: Enforce a configurable visibility window for members (Default: last 12 months visible to member; older statements remain admin-visible for retention/audit).
- **REQ-BIL-04**: Admin view of all statements (including archived/older).

### User Stories
- **US-MEM-4**: As a Member, I want to download my January statement.

## 6. Bulk Billing Upload

### Functional Requirements
- **REQ-BLK-01**: Upload ZIP file containing multiple PDFs.
- **REQ-BLK-02**: Parse filenames to identify statement period + unit (Format: MMM-YYYY <Building><Cluster>-<Unit>.pdf, example: DEC-2025 3C-201.pdf).
    - Building: 1–4
    - Cluster: A–F
    - Unit: numeric (e.g., 201)
    - Month: JAN..DEC (English 3-letter month)
    - Year: 4 digits
- **REQ-BLK-02a**: Reject files that do not match the required filename pattern and include them in the bulk report as failures.
- **REQ-BLK-03**: Process files individually; failure of one does not stop others.
- **REQ-BLK-04**: Generate summary report: Total, Success Count, Failure Count, List of Errors.
- **REQ-BLK-05**: Duplicate Policy: If statement exists for same Member+Month, **Replace** existing (MVP decision).

### User Stories
- **US-ADM-4**: As an Admin, I want to upload 500 statements at once and see which ones failed.

## Success Criteria
- **Performance**: QR Validation < 500ms (95th percentile).
- **Scale**: Support 5,000 members, 10,000 content items.
- **Reliability**: Bulk upload of 500 items completes without timeout.
- **Security**: No unauthorized access to billing data (Pen-test ready).

## Future Work (Out of Scope)
- Public self-registration.
- Member content creation (comments, posts).
- Recurring events.
- In-app payments.
- Push notifications.
