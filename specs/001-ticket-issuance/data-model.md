# Data Model: Ticket Issuance

## Entity Updates

### Event
*   **New Field**: `capacity` (Int, default: 1000) - Global capacity for the event.

### Ticket
*   **New Field**: `code` (String, unique) - The plaintext unique code for the ticket (used for QR).
*   **New Field**: `status` (Enum: `VALID`, `VOIDED`, default: `VALID`) - Status of the ticket.
*   **Existing**: `code_hash` (String) - Keep for now, potentially for secure verification, or deprecate if unused. We will populate it with hash of `code`.

## Enums

### TicketStatus
*   `VALID`
*   `VOIDED`

## Prisma Schema Changes

```prisma
model Event {
  // ... existing fields
  capacity Int @default(1000)
}

enum TicketStatus {
  VALID
  VOIDED
}

model Ticket {
  // ... existing fields
  code      String       @unique
  status    TicketStatus @default(VALID)
  // code_hash String // Keep existing
}
```
