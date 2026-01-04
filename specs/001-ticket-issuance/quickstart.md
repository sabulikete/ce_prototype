# Quickstart: Ticket Issuance

## Prerequisites
*   Node.js 20+
*   Docker (for MySQL)
*   Prisma CLI

## Setup

1.  **Database Migration**:
    ```bash
    cd server
    npx prisma migrate dev --name add_ticket_issuance
    ```

2.  **Start Backend**:
    ```bash
    cd server
    npm run dev
    ```

3.  **Start Frontend**:
    ```bash
    cd client
    npm run dev
    ```

## Testing

1.  **Run Backend Tests**:
    ```bash
    cd server
    npm test
    ```

2.  **Manual Test**:
    *   Login as a user.
    *   Go to an Event page.
    *   Click "Get Tickets".
    *   Select quantity (e.g. 5).
    *   Confirm.
    *   Verify tickets appear in "My Tickets".
