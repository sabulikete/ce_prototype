# Quickstart: Member Portal Platform MVP

## Prerequisites
- Node.js 18+
- Docker (for MySQL)
- npm or yarn

## Setup

1.  **Environment Variables**
    Copy `.env.example` to `.env` in both `client/` and `server/`.
    ```bash
    # server/.env
    DATABASE_URL="mysql://user:password@localhost:3306/ce_app"
    JWT_SECRET="super-secret-key"
    BILLING_VISIBLE_MONTHS=12
    ```

2.  **Database**
    Start MySQL container:
    ```bash
    docker run --name ce-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=ce_app -p 3306:3306 -d mysql:8
    ```
    Run migrations:
    ```bash
    cd server && npx prisma migrate dev
    ```

3.  **Backend**
    ```bash
    cd server
    npm install
    npm run dev
    ```

4.  **Frontend**
    ```bash
    cd client
    npm install
    npm run dev
    ```

## Verification
- Visit `http://localhost:5173` (Vite default).
- Login with seed admin credentials (see `server/prisma/seed.ts`).
- Verify "Dashboard" loads.
