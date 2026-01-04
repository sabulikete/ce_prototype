# Research Notes - Invited Users Status Visibility

## Decision 1: Invitation lifecycle source of truth
- **Decision**: Extend the existing `Invite` model with explicit lifecycle fields (`status`, `revoked_at`, `reminder_count`, `last_sent_at`) and Prisma enum values so status badges are computed server-side.
- **Rationale**: Persisted status removes guesswork on the frontend, keeps the backend authoritative, and aligns with the Constitution's "Backend Authority" principle. Additional metadata supports the audit requirements in the spec (age of invite, reminder count) and future automation.
- **Alternatives considered**:
  - *Derive status on the fly from `expires_at`/`used_at`*: rejected because it cannot capture manual revocation or reminder counts, and adds brittle logic to every caller.
  - *Create a new `InvitationStatusHistory` table*: rejected for MVP scope—single table with timestamps plus audit logging satisfies requirements without extra joins.

## Decision 2: API strategy for mixed user + invitation lists
- **Decision**: Keep a single admin `/users` endpoint but add a backend union view that returns both `User` and `Invite` records with a normalized DTO (name/email/role/status plus invitation metadata). Use a `view` query param (`invited`, `active`, `inactive`, `all`).
- **Rationale**: Maintains existing admin tooling while centralizing filtering rules on the server. Backend can enforce RBAC and pagination, keeping the frontend untrusted per Constitution. Also reduces API surface vs introducing `/invites` endpoints that the table would have to merge itself.
- **Alternatives considered**:
  - *Separate `/admin/invites` endpoint*: increases number of round trips and complicates default-tab UX because the frontend must orchestrate two datasets.
  - *Client-side filtering only*: rejected for security—guests should never receive invite data.

## Decision 3: Frontend default tab + data hydration
- **Decision**: Use the existing table layout component but wrap it in a tabbed control (Invited, Active, Inactive). Each tab triggers a refetch through React Query (or the existing data hook) with the matching `view`. Keep Invited as the default tab per clarification.
- **Rationale**: Minimizes rework, keeps UI consistent, and allows incremental rendering (suspense/loading states localized to the tab). Also ensures search/filter state can be scoped per tab if needed.
- **Alternatives considered**:
  - *Separate page for invites*: adds navigation friction and violates the spec's requirement that invites show up in the user management page itself.
  - *Multi-select status filter only*: does not satisfy "default to invited view" and increases risk of admins forgetting to toggle filters.

## Decision 4: Security controls for invitation data
- **Decision**: Gate union endpoints behind admin/staff RBAC and reuse existing JWT middleware plus rate limiting (already via `express-rate-limit`). Log invitation view/resend actions for audit trails.
- **Rationale**: Invitation data includes PII (emails); Constitution mandates backend enforced authorization and auditability. Leveraging existing middleware lowers risk and ensures consistent behavior.
- **Alternatives considered**:
  - *Expose invites without extra logging*: rejected because troubleshooting onboarding requires traceability and we already maintain audit timestamps.
  - *Rely solely on frontend role checks*: violates Backend Authority principle.
