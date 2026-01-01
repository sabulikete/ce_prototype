<!-- Sync Impact Report
Version: 1.0.0 (Initial)
Modified Principles: N/A (Initial creation)
Added Sections: Purpose, Product Intent, Decision Authority, Content Governance, Events and QR-Based Entry, Billing Statements, Roles & Permissions, User Lifecycle, Authentication & Security, Data Integrity and Auditability, Non-Functional Requirements, Technology Constraints, Conflict Resolution
Templates requiring updates: None
Follow-up TODOs: None
-->

# Member Portal Platform Constitution

## Purpose

This Constitution defines the foundational principles, constraints, and decision rules governing the design and implementation of the system.

All specifications, designs, and implementations must conform to this Constitution.

If a request conflicts with this Constitution, the conflict must be explicitly identified before proceeding.

## Product Intent

The system is a Member Portal Platform that provides:

*   Public-facing informational content
*   Authenticated member-only content
*   Administrative content management
*   Event management with QR-based entry validation
*   Secure billing statement distribution to members

The product is an MVP intended for real-world use, not a prototype.

## Decision Authority

The Constitution overrides all other documents.

*   Specifications refine behavior but do not override principles.
*   Implementation must follow specifications exactly.
*   Ambiguity must be resolved through clarification, not assumption.

## Core Principles

### Backend Authority

The backend is the single source of truth.

*   Authorization, visibility, and validation rules are enforced server-side.
*   Client-side logic is treated as untrusted.

### Spec-Driven Development

Specifications precede implementation.

*   Code must implement specifications, not reinterpret them.
*   Behavioral changes require specification updates before code changes.

### Simplicity and Restraint

Prefer simple, proven architectural patterns.

*   Avoid unnecessary abstraction, premature optimization, or over-engineering.
*   Introduce complexity only when justified by concrete requirements.

## Content Governance

### Unified Content Model

All informational content conforms to a unified content model with a defined type.

Supported content types:
*   announcement
*   event
*   memo
*   activity

### Content Lifecycle

All content follows a defined lifecycle:
`draft` → `published` → `archived`

Rules:
*   Draft and archived content are visible only to administrators.
*   Only published content is visible to members or guests.

### Visibility

Content visibility is explicit and enforced:
*   `public`: visible to guests, members, and admins
*   `member`: visible only to authenticated members and admins

### Pinning

Pinning is supported via an explicit flag.
*   Pinned content appears before non-pinned content.
*   Pinning applies only to published content.

## Events and QR-Based Entry

### Event Governance

Events are a specialized content type with additional attributes:
*   A start date is required.
*   End date and location are optional.
*   Events are archived rather than deleted.
*   Event visibility and ordering are derived from scheduling attributes.

### QR Code Ticketing

Event entry is validated using QR codes.
*   QR codes represent tickets, not identity.
*   Tickets are issued only by administrators.
*   Tickets are associated with authenticated members.
*   A member may hold multiple tickets per event within defined limits.

### Ticket Validation

QR scanning requires backend validation.
*   Ticket validation is atomic and prevents reuse.
*   A ticket may be checked in only once.
*   Tickets cannot be voided after check-in.
*   Check-in actions are auditable and immutable.

### Scanner Access Rules

Scanner access is restricted to authenticated staff roles.
*   Scanners may operate concurrently across multiple devices.
*   Internet connectivity is required for validation.
*   Scanner-visible events are limited to defined time windows relative to the event schedule.

## Billing Statements

### Billing Governance

Billing statements are issued and uploaded by administrators.
*   Statements are associated with authenticated members.
*   Members may access only their own statements.

### Billing Visibility Rules

Members may view billing statements only within a defined rolling time window.
*   Older statements may be retained for administrative or audit purposes but are not member-visible.

### Bulk Processing

Bulk billing uploads are supported.
*   Bulk processing must be resilient to partial failure.
*   Per-item success or failure is explicitly reported.
*   Duplicate billing entries follow defined replacement rules.

## Roles & Permissions

Defined roles:
*   Guest
*   Member
*   Admin
*   Staff (scanner)

Rules:
*   Guests and members are read-only.
*   Only admins may manage content, events, tickets, and billing.
*   Only staff and admins may perform QR scanning.
*   Role enforcement is performed exclusively by the backend.

## User Lifecycle

Users are created via administrator-issued invite links.
*   Public self-registration is not supported.
*   Invite tokens are single-use, expiring, and securely stored.
*   Password resets are email-based and token-protected.

## Authentication & Security

*   Passwords are hashed using industry-standard algorithms.
*   Authentication uses time-limited tokens.
*   Sensitive tokens are never stored in plaintext.
*   Rate limiting is required on authentication and scanning endpoints.

## Data Integrity and Auditability

*   Persistent records include audit timestamps.
*   Destructive operations are avoided in favor of archival.
*   Ticket check-ins and billing uploads are auditable.
*   Database schema changes are managed through migrations.

## Non-Functional Requirements

The system must provide:
*   Pagination on list endpoints
*   Regular database backups
*   Health check endpoints
*   Structured server-side logging
*   Safe handling of bulk operations

## Technology Constraints

The system uses:
*   React with TypeScript for frontend
*   Node.js with Express and TypeScript for backend
*   MySQL for persistence

Alternative technologies require explicit approval.

## Governance

### Conflict Resolution

When a request conflicts with this Constitution:
1.  Identify the conflict
2.  Explain the implications
3.  Request explicit authorization before proceeding

Silent deviation is not permitted.

**Version**: 1.0.0 | **Ratified**: 2026-01-01 | **Last Amended**: 2026-01-01
