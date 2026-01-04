# CE App - Community Engagement Application

A full-stack web application for community management with member portal, billing, events, and announcements.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1. **Clone the repository**
```bash
cd /Users/mike/Developer/ce_app
```

2. **Start the Backend Server**
```bash
cd server
npm install
npx prisma db seed  # Seed the database with initial admin user
npm run dev
```
Server runs on `http://localhost:3000`

3. **Start the Frontend (in a new terminal)**
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173` (or 5174 if 5173 is busy)

## 🔐 Demo Credentials

### Admin Account
- Email: `admin@example.com`
- Password: `admin`

### Member Account
- You can invite a new member from the Admin > User Management page.
- Or use the seed data if available.

## ✨ Features Implemented

### 1. **User Management** (`/admin/users`)
- ✅ Invite users via email
- ✅ Generate unique activation tokens
- ✅ Copy invite links
- ✅ User activation flow
- ✅ Role-based access (Admin/Staff/Member)
- ✅ Database-backed authentication (Prisma + SQLite/MySQL)
- ✅ Dedicated **Invited** tab that loads by default with lifecycle metadata (sent/last sent dates, reminder counts, inviter)
- ✅ Resend/Revoke actions with conflict badges, reminder limits, and toast feedback

### 2. **Content Management** (`/admin/posts`)
- ✅ Unified system for Announcements, Events, and Memos
- ✅ Public vs Members-Only visibility
- ✅ Draft/Published/Archived status
- ✅ Pin important posts
- ✅ Event scheduling with dates and locations

### 3. **Billing Management**
- ✅ Admin: Bulk ZIP upload simulation (`/admin/billing`)
- ✅ Member: View billing statements (`/billing`)
- ✅ 3-month rolling window enforcement
- ✅ Filename parsing and validation

### 4. **Event & Ticket System**
- ✅ **Event Creation**: Admins can create and schedule events.
- ✅ **Ticket Generation**: Members receive QR code tickets for events (`/tickets`).
- ✅ **Downloadable Tickets**: Members can download their QR codes as images.
- ✅ **Ticket Scanner** (`/scanner`):
    - 📷 **Real Camera Support**: Staff/Admins can scan QR codes using the device camera.
    - ⌨️ **Manual Entry**: Fallback for manual token entry.
    - ✅ **Validation**: Real-time check-in validation against the database.

### 5. **Modern UI/UX**
- ✅ **Glassmorphism Design**: Premium look for Login, Dashboard, and Landing pages.
- ✅ **Responsive Layout**: Works on mobile and desktop.
- ✅ **Public Landing Page**: Displays public announcements and events.

## 📁 Project Structure

```
ce_app/
├── server/                 # Backend (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Auth & Validation middleware
│   │   ├── models/        # Prisma models (schema.prisma)
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic (QR, Auth)
│   │   └── server.ts      # Server entry point
│   ├── prisma/            # Database schema and seed data
│   └── database.sqlite    # SQLite database (dev)
│
├── client/                # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── Events/    # Ticket & Event components
│   │   │   ├── Layout/    # Sidebar & MainLayout
│   │   ├── context/       # React Context (Auth)
│   │   ├── pages/         # Page components
│   │   │   ├── Admin/     # Admin management pages
│   │   │   ├── Scanner.tsx # QR Code Scanner
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── LandingPage.tsx
```

## 🛠 Tech Stack

- **Frontend**: React, Vite, TypeScript, CSS Modules, Lucide React (Icons), html5-qrcode (Scanning), qrcode.react (Generation).
- **Backend**: Node.js, Express, TypeScript, Prisma ORM.
- **Database**: SQLite (Development), MySQL (Production ready).
