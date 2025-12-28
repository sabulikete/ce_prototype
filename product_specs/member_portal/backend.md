Step-by-step Full-Stack Plan (MVP)
Step 0 — Repo + Local Dev Setup (1 project, 2 apps)

Folder layout

member-portal/
  backend/
  frontend/
  docker-compose.yml   (optional but recommended)
  README.md

Backend stack

Node.js + Express + TypeScript

MySQL

JWT auth

bcrypt password hashing

zod (or joi) for input validation

Frontend stack

React + TypeScript (Vite)

React Router

UI lib (pick one): MUI or Ant Design (either is fine for admin panels)

Step 1 — Database + First Admin User
1.1 Tables (MVP)

users

id (PK)

name

email (unique)

password_hash

role (ADMIN | MEMBER)

created_at

posts

id (PK)

title

content

type (announcement | event | memo)

visibility (public | member)

created_by (FK users.id)

created_at

updated_at

CTO note: This “posts” table keeps the MVP simple and flexible. You can split tables later if needed.

1.2 Seed an admin

We’ll create a simple script/endpoint to create the first admin user safely (one-time).

Step 2 — Backend: Auth (Login + “Who am I”)
Endpoints (first ones)

POST /auth/login

input: email, password

output: { token, user: {id, name, role} }

GET /auth/me

requires JWT

output: current user

Middleware

requireAuth (valid JWT)

requireRole('ADMIN')

Step 3 — Frontend: Routing + Login + Protected Layout
Pages to build first

/ Home (public)

/login Login page

/member Member dashboard (protected)

/admin Admin dashboard (protected + admin only)

Core frontend pieces

Auth store (token in memory + localStorage)

API helper that attaches Authorization: Bearer <token>

Route guards:

ProtectedRoute (logged-in)

AdminRoute (role check)

Step 4 — Backend: Content APIs (Public + Member + Admin CRUD)
Public content

GET /posts?visibility=public

GET /posts/:id (public only unless member/admin)

Member content

GET /posts?visibility=member (requires auth)

Admin CRUD

POST /admin/posts

PUT /admin/posts/:id

DELETE /admin/posts/:id

GET /admin/posts (list all posts)

Validation rules:

title required (min length)

type enum

visibility enum

content required

Step 5 — Frontend: Content UI
Public

Home shows:

latest public announcements

upcoming events (type=event, visibility=public)

Member dashboard

list member-only posts

filter by type (announcement/event/memo)

Admin dashboard

table list of posts

create/edit form

delete confirmation

Step 6 — MVP “Done” Checklist

You’re MVP-complete when:

✅ Admin can log in

✅ Admin can create public and member-only posts

✅ Public can view public posts

✅ Members can log in and public and member-only posts

✅ Access rules enforced by backend