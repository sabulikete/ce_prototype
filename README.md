# CE App - Community Engagement Application

A full-stack web application for community management with member portal, billing, events, and announcements.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- npm

### Installation

1. **Clone the repository**
```bash
cd /Users/mike/Developer/ce_app
```

2. **Start the Backend Server**
```bash
cd server
npm install  # (already done)
node src/index.js
```
Server runs on `http://localhost:3000`

3. **Start the Frontend (in a new terminal)**
```bash
cd client
npm install  # (already done)
npm run dev
```
Client runs on `http://localhost:5174`

## 🔐 Demo Credentials

### Admin Account
- Email: `admin@ce.app`
- Password: `admin`

### Member Account
- Email: `member@ce.app`
- Password: `member`

## ✨ Features Implemented

### 1. **User Management** (`/admin/users`)
- ✅ Invite users via email
- ✅ Generate unique activation tokens
- ✅ Copy invite links
- ✅ User activation flow
- ✅ Role-based access (Admin/Member)
- ✅ Database-backed authentication

### 2. **Content Management** (`/admin/posts`)
- ✅ Unified system for Announcements, Events, and Memos
- ✅ Public vs Members-Only visibility
- ✅ Draft/Published/Archived status
- ✅ Pin important posts
- ✅ Event scheduling with dates and locations
- ✅ Real-time updates

### 3. **Billing Management**
- ✅ Admin: Bulk ZIP upload simulation (`/admin/billing`)
- ✅ Member: View billing statements (`/billing`)
- ✅ 3-month rolling window enforcement
- ✅ Filename parsing and validation

### 4. **Event Management** (`/admin/events`)
- ✅ QR code ticket generation
- ✅ Simulated scanner for validation
- ✅ Event creation and management

### 5. **Public Landing Page** (`/`)
- ✅ Displays public announcements
- ✅ Shows upcoming public events
- ✅ Premium glassmorphism design
- ✅ Responsive layout

## 📁 Project Structure

```
ce_app/
├── server/                 # Backend (Node.js + Express + Sequelize)
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── models/        # Sequelize models (User, Post)
│   │   ├── routes/        # API routes
│   │   └── index.js       # Server entry point
│   └── database.sqlite    # SQLite database (auto-generated)
│
├── client/                # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # Reusable components (Sidebar, Layout)
│   │   ├── context/       # React Context (Auth)
│   │   ├── pages/         # Page components
│   │   │   ├── Admin/    # Admin-only pages
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Billing.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   └── AcceptInvite.jsx
│   │   └── App.jsx        # Main app with routing
│   └── vite.config.js     # Vite config with API proxy
│
└── product_specs/         # Product specifications
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users
- `GET /api/users` - List all users
- `POST /api/users/invite` - Invite new user
- `POST /api/users/activate` - Activate account with token
- `DELETE /api/users/:id` - Delete user

### Posts (Announcements, Events, Memos)
- `GET /api/posts?type=announcement&visibility=public` - List posts
- `POST /api/posts` - Create post
- `PATCH /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

## 🎨 Design System

- **Theme**: Dark mode with glassmorphism
- **Colors**: Purple/Violet primary with gradient accents
- **Typography**: System fonts with custom weights
- **Components**: Reusable glass panels, buttons, inputs
- **Animations**: Smooth transitions and ambient backgrounds

## 📚 Documentation

- [Content Management System](./CONTENT_MANAGEMENT.md) - Detailed guide for posts/events/announcements
- [Product Specs](./product_specs/) - Full product specifications

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- Sequelize ORM
- SQLite (dev) / MySQL (production-ready)
- JWT for authentication (mocked for MVP)

### Frontend
- React 18
- React Router v6
- Vite (build tool)
- Lucide React (icons)
- QRCode.react (QR generation)
- Framer Motion (animations)

## 🔄 Workflow

### Inviting a New User
1. Admin logs in → User Management
2. Click "Invite New User"
3. Enter email, name, role
4. Click "Send Invite"
5. Copy the invite link (🔗 icon)
6. Share link with user
7. User opens link → Sets password → Account activated
8. User can now login

### Creating Public Content
1. Admin logs in → Content
2. Select tab (Announcements/Events/Memos)
3. Click "New [Type]"
4. Fill in details
5. Set Visibility to "Public"
6. Click "Publish"
7. Content appears on Landing Page immediately

## 🐛 Troubleshooting

### Server won't start
```bash
cd server
pkill -f "node src/index.js"  # Kill any running instances
rm database.sqlite            # Reset database
node src/index.js
```

### Client won't start
```bash
cd client
rm -rf node_modules
npm install
npm run dev
```

### Database issues
The SQLite database is auto-created. To reset:
```bash
cd server
rm database.sqlite
node src/index.js  # Will recreate with seed data
```

## 🚧 Next Steps / Roadmap

- [ ] Member Dashboard with personalized content
- [ ] Email integration for invites
- [ ] Rich text editor for posts
- [ ] Image uploads
- [ ] Comments system
- [ ] RSVP for events
- [ ] Push notifications
- [ ] Mobile app (React Native)

## 📄 License

Proprietary - CE App

## 👥 Team

Built with ❤️ by the CE App team
