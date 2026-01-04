# Tasks: Ticket Issuance

**Feature Branch**: `001-ticket-issuance`
**Spec**: [spec.md](spec.md)

## Phase 1: Setup & Configuration

- [x] T001 Update Prisma schema with `Event.capacity`, `Ticket.code`, and `Ticket.status` in [server/prisma/schema.prisma](server/prisma/schema.prisma)
- [x] T002 Generate and apply Prisma migration in [server/prisma/migrations](server/prisma/migrations)
- [x] T003 Define `MAX_TICKETS_PER_USER_PER_EVENT` constant in [server/src/config/constants.ts](server/src/config/constants.ts)

## Phase 2: Foundational API

- [x] T004 Create `TicketService` class structure in [server/src/services/TicketService.ts](server/src/services/TicketService.ts)
- [x] T005 Create `TicketController` with basic methods in [server/src/controllers/TicketController.ts](server/src/controllers/TicketController.ts)
- [x] T006 Define ticket routes in [server/src/routes/ticketRoutes.ts](server/src/routes/ticketRoutes.ts)
- [x] T007 Register ticket routes in [server/src/app.ts](server/src/app.ts)

## Phase 3: User Story 1 - Issue Multiple Tickets

- [x] T008 [US1] Implement `issueTickets` method with quantity handling in [server/src/services/TicketService.ts](server/src/services/TicketService.ts)
- [x] T009 [US1] Implement global event capacity check (default 1000) in [server/src/services/TicketService.ts](server/src/services/TicketService.ts)
- [x] T010 [US1] Implement per-user cap check (default 50) in [server/src/services/TicketService.ts](server/src/services/TicketService.ts)
- [x] T011 [US1] Add `issueTickets` API call in [client/src/services/ticketService.ts](client/src/services/ticketService.ts)
- [x] T012 [US1] Add quantity selector to Admin Issuance Modal in [client/src/components/Admin/Events/IssuanceModal.jsx](client/src/components/Admin/Events/IssuanceModal.jsx)

## Phase 4: User Story 2 - Partial Fulfillment

- [x] T013 [US2] Implement partial fulfillment logic (calculate remaining vs requested) in [server/src/services/TicketService.ts](server/src/services/TicketService.ts)
- [x] T014 [US2] Update controller to return detailed issuance response (issued, requested, capReached) in [server/src/controllers/TicketController.ts](server/src/controllers/TicketController.ts)
- [x] T015 [US2] Handle partial fulfillment response in UI in [client/src/components/Admin/Events/IssuanceModal.jsx](client/src/components/Admin/Events/IssuanceModal.jsx)

## Phase 5: User Story 3 - Voided Tickets Exclusion

- [x] T016 [US3] Update ticket count query to exclude `VOIDED` tickets in [server/src/services/TicketService.ts](server/src/services/TicketService.ts)

## Phase 6: User Story 4 - Invited User Issuance

- [x] T017 [US4] Add validation to allow issuance only to `ACTIVE` or `INVITED` users in [server/src/services/TicketService.ts](server/src/services/TicketService.ts)
- [x] T018 [US4] Implement `getTickets` logic to mask/hide QR code for `INVITED` users in [server/src/controllers/TicketController.ts](server/src/controllers/TicketController.ts)

## Phase 7: User Story 5 - Concurrency Handling

- [x] T019 [US5] Wrap issuance logic in `prisma.$transaction` for atomic capacity checks in [server/src/services/TicketService.ts](server/src/services/TicketService.ts)

## Phase 8: Polish & Cleanup

- [x] T020 Add error handling for invalid event IDs or user states in [server/src/controllers/TicketController.ts](server/src/controllers/TicketController.ts)
- [x] T021 Ensure no email notifications are triggered (verify silent issuance) in [server/src/services/TicketService.ts](server/src/services/TicketService.ts)

## Dependencies

1.  **US1** depends on **Setup** & **Foundational**.
2.  **US2** depends on **US1**.
3.  **US3** depends on **US1**.
4.  **US4** depends on **US1**.
5.  **US5** depends on **US1**.

## Implementation Strategy

1.  **MVP**: Complete Phases 1, 2, and 3 to get basic issuance working.
2.  **Refinement**: Add partial fulfillment (Phase 4) and concurrency safety (Phase 7).
3.  **Edge Cases**: Handle voided tickets (Phase 5) and invited users (Phase 6).
