# CE App Client

This is the frontend for the CE App, built with Vite + React.

## Features Implemented
- **Authentication (Mocked)**: Login as Admin (`admin@ce.app`) or Member (`member@ce.app`).
- **Dashboard**: Overview of announcements and stats.
- **Billing**:
  - **Member**: View only last 3 months of statements (mocked logic).
  - **Admin**: "Bulk Upload" simulation with drag-and-drop ZIP handling and console logs showing filename parsing.
- **Events**:
  - **Admin**: Create events, generate tickets with QR codes.
  - **scanner**: Built-in simulator to "scan" text/QR codes and validate against generated tickets.

## How to Run
1. Navigate to `client` directory: `cd client`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

## Tech Stack
- React 18
- Vite 5
- CSS Modules / Vanilla CSS Variables for styling (Glassmorphism theme)
- `lucide-react` for icons
- `qrcode.react` for QR generation

## Notes
- The backend logic is currently mocked in the frontend for demonstration purposes (e.g., `simulatedUpload`, `AuthContext`).
- Configured to run on Node 18+.
