# Research: Ticket Issuance

**Feature**: Ticket Issuance
**Status**: Complete

## 1. Concurrency & Cap Enforcement

**Problem**: How to prevent overselling when multiple users purchase simultaneously?

**Options**:
1.  **Optimistic Concurrency**: Use a version field. Retry if failed.
2.  **Pessimistic Locking**: `SELECT ... FOR UPDATE`.
3.  **Prisma Interactive Transactions**: Perform check and insert within a transaction.

**Decision**: **Prisma Interactive Transactions**.
**Rationale**: Prisma's `` API allows us to count existing tickets and insert new ones atomically. Since we are using MySQL, this will ensure data integrity.
**Implementation**:
```typescript
await prisma.$transaction(async (tx) => {
  const currentCount = await tx.ticket.count({ where: { event_id, user_id, status: 'VALID' } });
  if (currentCount + requested > CAP) throw new Error('Cap exceeded');
  // ... create tickets
});
```

## 2. Ticket Code & QR Generation

**Problem**: How to generate and store ticket codes for QR display?

**Options**:
1.  **Store Hash Only**: Secure, but cannot display QR if code is lost.
2.  **Store Plaintext Code**: Allows easy QR generation.
3.  **Signed Token (JWT)**: Stateless, but revocation is harder.

**Decision**: **Store Plaintext Code (Unique UUID or Random String)**.
**Rationale**: We need to display the QR code to the user. Storing the code allows us to regenerate the QR on demand. The existing `code_hash` field in the schema suggests a hashing strategy, but for MVP usability, we will add a `code` field or repurpose `code_hash` if it was intended to be the code itself (misnamed).
**Refinement**: We will add a `code` string field to the `Ticket` model. `code_hash` can be removed or kept for scanner verification if the scanner hashes before sending (unlikely for MVP). We will assume `code` is needed.

**Library**: `qrcode` (npm) for generating QR images/data URLs on the frontend or backend.

## 3. Configuration Storage

**Problem**: Where to store `MAX_TICKETS_PER_USER_PER_EVENT`?

**Decision**: **`server/src/config/constants.ts`**.
**Rationale**: Simple, centralized, and easy to move to a database/admin setting later.

## 4. Global Event Capacity

**Problem**: How to enforce the 1000 global limit?

**Decision**: **Add `capacity` field to `Event` model**. **Refinement**: The `Event` model currently lacks a `capacity` field. We will add `capacity Int @default(1000)` to the Prisma schema.
