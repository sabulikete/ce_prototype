Public website

Anyone can view:

Activities page (photos/text)

Upcoming events list + event details

Public announcements / public memos (optional)

Contact / about / FAQ

Member portal (login required)

Only logged-in users can view:

Internal announcements / internal memos

Private downloads (PDFs, forms)

Member-only event details (venue map, RSVP link, etc.)

Admin dashboard (login + admin role required)

Admins can:

Create / edit / delete announcements, memos, events, activities

Choose visibility: Public or Members-only

Upload attachments (images, PDFs)

Publish/unpublish, schedule posts (optional)

Manage users/roles (optional, but common)

2) Data model (simple + scalable)

You can treat everything as “content” with a type and visibility.

Tables (example):

users (id, name, email, password_hash, role, status)

posts (id, type: announcement|memo|activity, title, body, visibility: public|private, published_at, created_by)

events (id, title, description, start_at, end_at, location, visibility, published_at, created_by)

attachments (id, owner_type: post|event, owner_id, file_name, file_url, mime_type, uploaded_by, created_at)

(Optional) audit_logs (admin actions history)

This makes it easy to add “other important stuff” later without rewriting everything.

3) Access control (how public vs private works)
Frontend

Public pages call public endpoints (no token needed).

Member pages call private endpoints (token required).

Admin pages call admin endpoints (token + admin role required).

Backend (important)

Every request checks:

Not logged in? Only allow “public visibility” content.

Logged in user? Allow public + private content.

Admin? Allow admin routes + content management routes.

This is usually done with:

JWT auth (login returns token)

Middleware like requireAuth and requireAdmin

4) Suggested tech stack (fits your current direction)

Since you already use React + Node/Express + MySQL in your other projects, this aligns well:

Frontend: React (or Next.js if you want SEO + faster public pages)

Backend: Node.js + Express

DB: MySQL

File storage: local storage for simple deployments, or S3-compatible storage for cleaner scaling

Auth: JWT (access token) + bcrypt password hashing

If you want the public pages to rank well on Google, Next.js is a strong choice (server-rendered public content, still supports member portal).

5) Development process (step-by-step)
Phase A — Planning (fast but important)

List content types (Announcements, Memos, Events, Activities)

Define fields for each (title/body/date/location/attachments)

Define visibility rules (public vs members-only)

Define roles (Admin, Member)

Deliverable: short spec + page list + API list.

Phase B — Database + backend foundation

Create MySQL schema (tables above)

Build authentication:

register (optional) / admin-create-user

login -> returns JWT

Build middleware:

requireAuth

requireAdmin

Build content APIs:

Public: GET /api/public/announcements, GET /api/public/events

Private: GET /api/member/memos, etc.

Admin: POST /api/admin/posts, PUT /api/admin/posts/:id, DELETE...

Build file upload:

POST /api/admin/upload (returns file URL saved in DB)

Deliverable: working API with role protection.

Phase C — Frontend (public site + member portal)

Public pages:

Home (highlights)

Announcements list + details

Events list + details

Activities

Login page:

Store token securely (usually in HttpOnly cookie if using Next.js; or local storage if simple)

Member pages:

Show private content only when logged in

Route protection:

Redirect to login if trying to access member-only pages without auth

Deliverable: users can browse public, members can see private after login.

Phase D — Admin dashboard

Admin login (same login, but role must be admin)

Admin UI:

Create/edit post/event

Set visibility (Public/Members-only)

Upload attachments

Publish/unpublish (and optionally schedule)

Admin list views with search/filter:

by type, date, visibility, published status

Deliverable: admins can manage site content end-to-end.

Phase E — Deployment + ops

Hosting:

Backend (Node) + DB (MySQL)

Frontend (static or Next.js server)

Add environment configs (DB credentials, JWT secret, storage path)

Basic security:

HTTPS

rate limiting on login

input validation

Backups:

DB backups

attachment storage backups

6) A simple “visibility” rule that keeps everything clean

For every content query, include:

WHERE visibility = 'public' for unauthenticated users

WHERE visibility IN ('public','private') for logged-in users

That single rule is the heart of “public vs members-only”.