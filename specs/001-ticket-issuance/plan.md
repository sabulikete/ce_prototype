# Implementation Plan: Ticket Issuance

**Branch**: `001-ticket-issuance` | **Date**: 2026-01-04 | **Spec**: [specs/001-ticket-issuance/spec.md](specs/001-ticket-issuance/spec.md)
**Input**: Feature specification from `specs/001-ticket-issuance/spec.md`

## Summary

Implement ticket issuance functionality allowing users to purchase multiple tickets (up to 50) for an event.
Key features include:
- Configurable per-user cap (default 50).
- Global event capacity (default 1000).
- Cumulative purchase tracking.
- Support for "Invited" users (silent issuance, QR visible on activation).
- Concurrency handling for cap enforcement.
- Single "Standard" ticket type.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20+), React 18+
**Primary Dependencies**: Express, Prisma, React, Vite
**Storage**: MySQL (via Prisma)
**Testing**: Jest (Backend), Vitest (Frontend)
**Target Platform**: Web (Responsive)
**Project Type**: Monorepo (client/server)
**Performance Goals**: <200ms response for issuance
**Constraints**: Strict concurrency control for ticket caps

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Backend Authority**: Issuance logic and cap enforcement reside in `server/src/services/TicketService.ts`.
- [x] **Spec-Driven**: Implementation follows `specs/001-ticket-issuance/spec.md`.
- [x] **Simplicity**: MVP uses single ticket type and config-based caps.
- [x] **Unified Content Model**: Events are `Content` type; Tickets link to `Event`.
- [x] **Visibility**: QR codes hidden for Invited users (enforced by backend).

## Project Structure

### Documentation (this feature)

```text
specs/001-ticket-issuance/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
server/
├── src/
│   ├── controllers/     # TicketController
│   ├── services/        # TicketService
│   ├── routes/          # ticketRoutes
│   └── config/          # constants (MAX_TICKETS)
└── prisma/
    └── schema.prisma    # Event capacity, Ticket updates

client/
├── src/
│   ├── components/
│   │   └── Events/      # PurchaseModal
│   └── services/        # ticketService.ts
```

**Structure Decision**: Option 2: Web application (frontend + backend)

## Complexity Tracking

N/A - No constitution violations.
