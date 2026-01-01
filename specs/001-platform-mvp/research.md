# Research & Decisions: Member Portal Platform MVP

**Feature**: 001-platform-mvp
**Date**: 2026-01-01

## 1. Technology Choices

### ORM: Prisma
- **Decision**: Use Prisma.
- **Rationale**: Recommended in architecture spec for type safety. Superior developer experience with TypeScript compared to TypeORM.
- **Alternatives**: TypeORM (more boilerplate), Sequelize (older).

### Styling: CSS Modules
- **Decision**: Use CSS Modules.
- **Rationale**: Matches existing project structure (`*.css` files alongside components). Avoids introducing new build dependencies like Tailwind for MVP unless explicitly requested.
- **Alternatives**: Tailwind (faster dev but requires setup), Styled Components (runtime overhead).

### PDF Storage: Local Filesystem (MVP)
- **Decision**: Store PDFs on local filesystem (volume mount in Docker).
- **Rationale**: Simpler for MVP than setting up S3. Abstract via a service interface so it can be swapped for S3 later.
- **Alternatives**: S3 (AWS costs/setup), Database BLOB (bad performance).

## 2. Unknowns & Clarifications Resolved

### Rolling Window Configuration
- **Resolution**: Use Environment Variables for MVP.
- **Details**: `BILLING_VISIBLE_MONTHS=12`.
- **Rationale**: Avoids building a settings UI for a value that rarely changes.

### Bulk Upload Duplicate Policy
- **Resolution**: **Replace** existing statement.
- **Details**: If `UnitID` + `Period` matches an existing record, overwrite the file and update the record.
- **Rationale**: Explicitly defined in Requirements `REQ-BLK-05`.

### QR Code Signing
- **Resolution**: HMAC-SHA256 (HS256) with a server-side secret.
- **Details**: Payload `{ ticketId, eventId }`.
- **Rationale**: Sufficient security for ticket validation; simpler than asymmetric keys for MVP.

## 3. Best Practices Adopted

### Bulk Processing
- **Pattern**: Stream-based processing for ZIP extraction to avoid memory spikes.
- **Error Handling**: "Fail-safe" iteration—catch errors per file, log them, and continue processing the rest.

### Security
- **Rate Limiting**: `express-rate-limit` for login and scan endpoints.
- **Auth**: `jsonwebtoken` for JWT handling. `bcryptjs` for password hashing.
