# Member Portal Platform - Overview

**Feature**: Member Portal Platform MVP
**Version**: 1.0.0
**Status**: Draft

## Executive Summary

The Member Portal Platform is a comprehensive system designed to manage member engagement, content distribution, event access, and billing transparency. It serves as the central hub for communication between the organization and its members, ensuring secure access to private information while maintaining a public face for general announcements.

## Core Modules

### A. Public Website
A public-facing interface for general information.
- **Content**: Announcements, activities, events, memos.
- **Visibility**: Only content marked `published` and `public` is visible.
- **Access**: Open to all internet users (Guests).

### B. Member Portal
A secure, authenticated environment for members.
- **Access**: Requires login.
- **Content**: View `published` content marked as `public` or `member-only`.
- **Capabilities**: Read-only access to content, personal billing statements, and event tickets.

### C. Admin Dashboard
The command center for staff and administrators.
- **Content Management**: Create, edit, publish, archive, and pin content.
- **User Management**: Onboard users via invite links; manage access.
- **Event Management**: Schedule events, issue tickets.
- **Billing Management**: Upload and manage billing statements.

### D. Events & Ticketing
A QR-code based entry system.
- **Tickets**: Digital assets associated with members for specific events.
- **Validation**: Real-time, online, atomic validation via QR scan.
- **Scanning**: Restricted to Staff/Admins within a specific time window.

### E. Billing Statements
Secure delivery of monthly financial statements.
- **Privacy**: Strict isolation—members see only their own statements.
- **Retention**: Rolling window visibility for members; archival retention for admins.

### F. Bulk Billing Upload
Operational efficiency tool for finance teams.
- **Process**: Bulk upload of zipped PDFs.
- **Intelligence**: Auto-association with members/units based on file naming.
- **Resilience**: Partial success handling and detailed reporting.
- **Filename format**: DEC-2025 3C-201.pdf (MMM-YYYY BuildingCluster-Unit).

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Guest** | Unauthenticated public user | Read-only access to public content. (Guest is the absence of authentication, not stored in the database). |
| **Member** | Authenticated resident/member | Read-only access to public/member content, own billing, own tickets. |
| **Admin** | System administrator | Full access to all modules, content creation, user management. |
| **Staff** | Operational staff | Limited access focused on event scanning and validation. |

## Strategic Constraints

1.  **MVP Scope**: Focus on core functionality for real-world deployment. Future work is explicitly deferred.
2.  **Backend Authority**: All business logic, validation, and authorization reside on the server.
3.  **Tech Stack**: React (Frontend), Node.js/Express (Backend), MySQL (Database).
