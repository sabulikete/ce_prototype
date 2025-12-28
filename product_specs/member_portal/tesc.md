Member Portal Website — MVP Technical Specification (v1)
1) Goal

Deliver a web portal where:

Guests can view public content

Members can view member-only content after login

Admins can create/manage content from an admin dashboard

2) Roles & Permissions
Capability	Guest	Member	Admin
View public posts	✅	✅	✅
View member-only posts	❌	✅	✅
Create posts	❌	❌	✅
Edit posts	❌	❌	✅
Delete posts	❌	❌	✅
Publish/Unpublish posts	❌	❌	✅
Manage users (optional in MVP)	❌	❌	✅

Backend is the source of truth for access control (frontend guards are UX only).

3) Core Features
Public (No login)

Home page (latest public announcements + public events)

Public posts list + post details

Member (Login required)

Member dashboard (member-only posts list + details)

Profile page (basic info)

Admin (Admin login required)

Admin dashboard

CRUD for posts:

Create / Edit / Delete

Visibility: public or member

Status: draft or published (recommended)

Type: announcement | event | memo

Optional (MVP+): Create member accounts / reset passwords

4) Data Model (MySQL)
users

id (PK, bigint, auto)

name (varchar)

email (varchar, unique index)

password_hash (varchar)

role (enum: ADMIN, MEMBER)

created_at (datetime)

updated_at (datetime)

posts

id (PK, bigint, auto)

title (varchar, indexed)

content (text)

type (enum: announcement, event, memo, indexed)

visibility (enum: public, member, indexed)

status (enum: draft, published, indexed)

created_by (FK → users.id, indexed)

created_at (datetime)

updated_at (datetime)

Indexes (minimum)

users.email UNIQUE

posts (visibility, status, created_at)

posts (type, visibility, status)

posts.created_by

5) API Contract (REST)
Auth

POST /api/v1/auth/login

body: { email, password }

returns: { token, user: { id, name, email, role } }

GET /api/v1/auth/me (Auth)

returns: { user }

(MVP+ but recommended)

POST /api/v1/auth/forgot-password (Public)

POST /api/v1/auth/reset-password (Public w/ token)

Public Posts

GET /api/v1/posts?visibility=public&type=&page=&limit=

returns: { data: Post[], meta: { page, limit, total } }

GET /api/v1/posts/:id

Behavior:

If post is public + published: allow guest

If member + published: require auth

If draft: admin only

Member Posts (Auth)

GET /api/v1/member/posts?type=&page=&limit=

returns member-visible, published posts

Admin Posts (Admin only)

GET /api/v1/admin/posts?status=&type=&visibility=&page=&limit=

POST /api/v1/admin/posts

PUT /api/v1/admin/posts/:id

DELETE /api/v1/admin/posts/:id

Standard Error Shape

{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }

6) Security Requirements (MVP)

Passwords hashed with bcrypt

JWT auth with expiry (e.g., 30–60 minutes)

Middleware:

requireAuth

requireRole('ADMIN')

Request validation via zod (body/query/params)

Use helmet, strict CORS, and rate-limit login

No sensitive info in logs (no tokens/passwords)

Token storage (frontend)

MVP acceptable: localStorage + attach Authorization: Bearer

More secure later: httpOnly cookies

7) Frontend Technical Specs

React + TypeScript + React Router

React Query (TanStack Query) for server state

React Hook Form + Zod for forms

Route Guards:

ProtectedRoute

AdminRoute

Core pages:

/ (public)

/login

/posts/:id

/member (member dashboard)

/admin (admin dashboard)

/admin/posts/new, /admin/posts/:id/edit

UI requirements

Loading/Empty/Error states on all data screens

Pagination support for lists (admin especially)

8) Non-Functional Requirements

Performance: paginate lists (default limit=20)

Reliability:

/health endpoint

DB backups daily (prod)

Observability:

structured logs with request_id

error tracking (MVP+ recommended)

9) Deployment (MVP)

Environments: dev, prod (add staging if possible)

Frontend hosted separately from backend

Backend behind HTTPS reverse proxy

MySQL: managed or VPS with backups enabled

Use migrations (required) for schema changes

10) Definition of Done (MVP)

Admin can log in and manage posts (CRUD)

Guests can view public published posts

Members can log in and view member-only published posts

Draft posts are hidden from guests/members

Backend enforces all access rules

Basic security baseline: validation, bcrypt, JWT, CORS, helmet, rate-limit login




1) Product/Functional specs you should lock down

Even simple portals go sideways if these aren’t decided early:

Content model

Types: announcement / event / memo (you already have)

Visibility: public / members-only

Status: draft / published / archived (highly recommended)

Pinning: “pinned announcement” (optional but useful)

Roles & permissions

Admin vs Member (MVP)

Later: Editor, Moderator, etc. (optional)

Search & filtering

Filter by type, date

Keyword search (later, but plan the DB indexes)

Auditability

“Created by / Updated by”

“When was this edited?”

User lifecycle

How do members get accounts?

Admin creates accounts? Self-signup with approval? Invite links?

Password reset

Don’t ship without a reset path if this will be used for real users

2) Architecture specs beyond “frontend + backend”

Environments

dev, staging, prod (even if staging is simple)

CI/CD

at least: run tests + lint on every push

Versioning

basic release notes or tags so you can roll back

Database migrations

must-have for consistent deployments

3) Operational best practices (what many MVPs forget)

This is what makes your app stable after you launch:

Observability

logs (backend)

error tracking (e.g., Sentry)

simple monitoring/uptime checks

Backups

automatic MySQL backups (daily at minimum)

Security hygiene

dependency scanning (npm audit, GitHub Dependabot)

rate limiting + brute-force protection

Access control hardening

admin accounts protected (strong passwords, maybe 2FA later)

Data retention

do you delete posts? archive them? who can?

4) UX and compliance-ish considerations

Not legal advice, but practical:

Privacy

Don’t expose member emails publicly

Avoid storing unnecessary personal info

Accessibility

readable contrast, keyboard navigation (UI libraries help)

Mobile responsiveness

admin pages should still work on phones in a pinch

If you want the “complete technical spec checklist” (CTO style)

Here’s what I recommend we document before coding too far:

A. Roles & Permissions

Guest, Member, Admin

Exact permissions matrix (who can create/edit/delete what)

B. Content Rules

Fields, status workflow, visibility rules

Sorting (latest first), pinning, archives

C. API Contract

Endpoints + request/response schema

Error format

Pagination/filter conventions

D. Data Model

Tables + indexes

Audit fields

Migration approach

E. Security Model

Auth method, token storage, session expiry

Rate limits, CORS, headers

Password policy + reset flow

F. Non-Functional Requirements

Availability expectations

Backup frequency

Logging + monitoring

Performance (pagination, caching plan)

G. Deployment Plan

Where frontend is hosted

Where backend is hosted

Where DB is hosted

Domain + SSL strategy

My CTO recommendation for you (so you don’t overthink)

For MVP, you don’t need “enterprise everything,” but you do need:

migrations

audit fields

status (draft/published)

password reset plan

backups + basic monitoring

Those 5 are the common “we regret not doing it” items.



1) Product / Functional specs to lock down
A) Content model

This defines what “content” is and how it behaves everywhere (DB, API, UI, permissions).

1) Types: announcement / event / memo

Announcement: usually time-sensitive info, shown prominently

Event: has dates (start/end), location (optional), RSVP (later)

Memo: more formal internal notice, often longer text

CTO recommendation (MVP):

Keep a single posts table but add event fields that can be null:

event_start_at, event_end_at, location (nullable)

Alternatively keep event in same posts with type='event' and store dates.

2) Visibility: public vs members-only

This is an access rule.

Backend must enforce it:

Guest can only fetch visibility='public' AND status='published'

Member can fetch both public and member (still only published)

3) Status: draft / published / archived
Status controls lifecycle:

Draft: only admins can see/edit (good for preparing content)

Published: visible to users based on visibility

Archived: not shown by default, still retrievable in admin/history

Why it matters: Without status, admins end up “posting accidentally” or deleting content that should be kept.

MVP behavior rules

Guests: only published + public

Members: only published + (public OR member)

Admin: all statuses

4) Pinning
Pinning is for “show this at the top” (especially announcements).
Options:

is_pinned boolean

pinned_until datetime (better if you want auto-expire)

pin_order int (if multiple pinned)

CTO recommendation: is_pinned + sort rule:

Pinned first, then newest.

B) Roles & permissions

MVP roles are simple but must be explicit to avoid security holes.

MVP roles

Guest: read-only public

Member: read-only member + public

Admin: manage content

Later roles (optional)

Editor: create/edit but cannot publish

Moderator: can archive/unpublish, but can’t delete

Super Admin: manage users, system settings

Best practice: implement permissions as:

requireAuth

requireRole('ADMIN')
…and later expand to requirePermission('posts:publish').

This keeps growth easy.

C) Search & filtering

This is both UX and performance.

MVP filtering (recommended)

Filter by:

type

date range (especially for events)

visibility (admin only)

status (admin only)

Keyword search

Can wait, but plan for it:

MySQL: start with LIKE search on title/content (small scale)

Later: FULLTEXT index or external search (Meilisearch/Elastic)

DB indexing

If you will filter by type/status/visibility, index them (we already listed key indexes).

Events: index event_start_at for sorting and “upcoming events”.

D) Auditability

This is the “who did what, and when?” part that saves you during disputes and debugging.

Minimum audit fields

created_by

updated_by (recommended)

created_at

updated_at

Optional but valuable

published_at

archived_at

archived_by

Audit log table (MVP+ optional)
If you want deeper tracking later:

audit_logs with action types (CREATE_POST, UPDATE_POST, LOGIN_FAIL, etc.)

For MVP, the fields above are enough.

E) User lifecycle

You must decide how accounts are created, because it impacts UI, security, and admin workload.

Common options:

Option 1: Admin creates accounts (recommended for MVP)

Admin adds member email + temp password

Member logs in and changes password

Pros: simple, controlled

Cons: admin work

Option 2: Invite links

Admin enters email → system sends invite link

Member sets password via link

Pros: good UX

Cons: requires email sending + token flows

Option 3: Self-signup + admin approval

Anyone can sign up, but account is PENDING

Admin approves

Pros: low admin entry effort

Cons: spam risk

CTO recommendation: start with Option 1, then evolve to invite links later.

F) Password reset

If real users will use it, password reset is a must.

MVP reset approach

POST /auth/forgot-password (email input)

Create token (random, single-use, short expiry like 15–60 min)

Send reset link by email (or show token in admin-only mode if email isn’t ready)

Security best practices

Never reveal whether an email exists (“If the email exists, we sent a link”)

Hash reset tokens in DB (don’t store raw token)

Invalidate after use

If you don’t want email in MVP:

Admin can “reset password” to a temporary password (still needs policy)

2) Architecture specs beyond “frontend + backend”
A) Environments (dev / staging / prod)

Purpose:

dev: your machine

staging: production-like testing area (even if minimal)

prod: real users

Why it matters: prevents “tested locally, broke in prod”.

Minimum best practice

separate .env per environment

separate DB per environment (never share prod DB with dev)

B) CI/CD

At minimum, every push should run:

lint

typecheck

tests (even few)

build (frontend)

Later, CD can auto-deploy to staging/prod.

Why it matters: catches errors before deployment.

C) Versioning / rollback

Even if you don’t “release notes”, you need the ability to roll back.

Best practice:

Tag releases (e.g., v1.0.0)

Keep deployment artifacts or commit SHAs used in production

Why it matters: if a new build breaks login, you can revert quickly.

D) Database migrations (must-have)

Never rely on “manual DB edits”.

Best practice:

Use a migration tool (Prisma Migrate, Knex migrations, or TypeORM migrations)

Every schema change is committed as a migration file

Migrations run in CI/staging/prod consistently

Why it matters: prevents “works on my DB” problems.

3) Operational best practices (what MVPs forget)
A) Observability

You need basic visibility into what’s happening.

Logs

Every request logs: method, path, status, duration, request_id

Errors log stack + request_id

Error tracking

Sentry (or similar) captures real runtime errors with context

Uptime checks

Ping /health every minute (cheap monitoring)

Alerts you when backend is down

B) Backups

Minimum: daily automatic MySQL backups

Keep at least 7–30 days retention

Test restore at least once (most people don’t)

Why it matters: accidental deletion, corruption, hosting failure.

C) Security hygiene

Enable Dependabot (or similar)

Run npm audit occasionally

Patch critical vulnerabilities quickly

Brute-force protection

Rate limit login endpoint

Optionally: lock user after X failed attempts for Y minutes

D) Access control hardening

Admin accounts:

strong password policy

avoid sharing one admin login

later add 2FA (optional)

Best practice: maintain separate admin users so you know who did what.

E) Data retention

Decide: delete vs archive.

CTO recommendation

Archive instead of delete for posts.

Allow delete only for admins (or super admins later).

Keep archive accessible in admin list with filters.

4) UX + compliance-ish considerations
A) Privacy

Don’t expose member email addresses in public content or URLs.

Store minimal personal info:

name, email, role is enough for MVP

Avoid storing birthdays, phone numbers, addresses unless truly needed.

B) Accessibility

If you use MUI/AntD and follow basics, you’ll be ahead already:

keyboard navigation for forms

readable contrast

proper headings and labels

C) Mobile responsiveness

Member portals get used on phones.
Admin pages too—at least “usable”, not perfect.

Rules:

tables should scroll horizontally on small screens

buttons not tiny

forms should stack vertically

Complete technical spec checklist — expanded into what to write down
A) Roles & Permissions

Define:

guest/member/admin

exact permission matrix

Implement:

backend middleware checks

B) Content Rules

Fields: title, content, type, visibility, status, pinned

Sorting rules

Draft/publish/archive workflow

C) API Contract

Endpoint list + request/response shapes

Error format

Pagination/filter rules

D) Data Model

Tables + indexes

Audit fields

Migration approach

E) Security Model

Auth method + token expiry

Token storage approach

CORS/helmet/rate limit

Password reset approach + password policy

F) Non-functional requirements

Performance: pagination and indexes

Availability: health endpoint + basic uptime check

Backups: frequency + retention

G) Deployment plan

Hosting plan (frontend/backend/db)

Domain + SSL

Environment variables per env

CTO “don’t overthink” MVP essentials (why these matter)

These are the 5 “we regret not doing it” items, with the reason:

Migrations → avoids broken deployments

Audit fields → accountability + debugging

Status workflow → prevents accidental posting/deleting

Password reset plan → real users will need it

Backups + monitoring → reduces “we lost data / site down” disasters



1) Content rules

Support for draft/published/archived

Support for pinning

Support for events: store start/end date + location

2) Account creation flow

Invite link (better UX, more work)

3) Password reset approach

Admin resets password manually (MVP shortcut)

Email-based reset (more complete; still doable in MVP)

4) Deployment + environments

At minimum: dev + prod (staging optional)

Where will backend + DB live? (VPS/managed)

Frontend host? (Vercel/Netlify)

5) Non-functional baselines (must decide)

Backups: daily + retention (7–30 days)

Basic monitoring: uptime ping + logs

Rate limiting on login




1) Content rules (draft/published/archived, pinning, events)
A) Status: draft / published / archived

What it means in the product

Draft: content is being prepared; only admins (and maybe editors later) can see it.

Published: visible to the intended audience (public or members-only).

Archived: no longer active; hidden from normal lists but kept for history.

Behavior rules (recommended)

Guests

can see: published + public

cannot see: drafts, archived, member-only

Members

can see: published + public, published + member

cannot see: drafts, archived

Admins

can see everything; can filter by status

Technical impact

DB field: status ENUM('draft','published','archived')

Query defaults:

Public/member lists default to status='published'

Admin list shows all with filter

Optional: store timestamps

published_at, archived_at for audit/history

Why it’s worth it

Prevents accidental posting

Avoids deleting older notices

Gives admins control + cleanliness

B) Pinning

What it means
Pinned posts appear at the top of the list (typically announcements/memos), regardless of date.

Common pinning models

Simple (best for MVP): is_pinned BOOLEAN

Sort: pinned first, then newest

Time-limited pin: pinned_until DATETIME

Automatically unpins after date

Multiple pinned order: pin_order INT

Useful if many pinned items

CTO recommendation for your MVP

Start with: is_pinned

Sorting rule:

ORDER BY is_pinned DESC, created_at DESC

Technical impact

DB field: is_pinned TINYINT(1) DEFAULT 0

Admin UI: toggle “Pin this”

Public/member API automatically returns pinned first

C) Events: store start/end date + location

Why events are different
An “event” is not just text — it has scheduling behavior:

“Upcoming events”

“Past events”

Sort by soonest upcoming, not by created date

Recommended event fields

event_start_at DATETIME (required for type=event)

event_end_at DATETIME (optional)

location VARCHAR(255) (optional)

Validation rule

If type = 'event':

event_start_at must exist

if event_end_at exists, it must be >= start

API implications

Public “upcoming events” endpoint can do:

WHERE type='event' AND status='published' AND event_start_at >= NOW()

Member-only events same idea but with visibility rules

UI implications

Event cards show date/time + location

Filters: “Upcoming” / “Past”

2) Account creation flow: Invite links (your choice)

Invite links are a great middle ground: controlled access + better UX than temp passwords.

How invite links work (recommended design)

Admin creates invitation

Admin enters email

System creates:

invite_token (random string)

expires_at (e.g., 48 hours)

role = MEMBER

status = PENDING (optional)

User receives link

Link format:

https://your-frontend.com/invite/<token>

User sets:

name

password

System activates the account

Security best practices

Token is single-use

Token expires

Store hashed token in DB (like passwords), not raw token

Don’t reveal if an email is already registered (avoid account enumeration)

Tables you may add

Option A (clean): invites table

id

email

token_hash

expires_at

used_at

created_by

created_at

Option B (simpler but less flexible): store invite fields on users

Works, but harder to manage multiple invites/resends cleanly

CTO recommendation: use a separate invites table.

API endpoints

POST /admin/invites (admin only) → create invite + send email

GET /auth/invite/:token → validate token (public)

POST /auth/invite/accept → set password + create/activate user (public)

Admin UX

Invite list: pending/used/expired

“Resend invite” button (creates new token; old token invalidated)

3) Password reset approach: Email-based reset (your choice)

This is standard and the most user-friendly.

Password reset flow

User submits email on “Forgot password”

Backend generates reset token (random), stores hash + expiry

Backend emails reset link

User opens link, sets a new password

Token invalidated after use

Security requirements

Always respond: “If an account exists, we sent instructions.”

Token expiry: 15–60 minutes

Hash the token in DB

Single use

DB table suggestion

password_resets

id

user_id

token_hash

expires_at

used_at

created_at

API endpoints

POST /auth/forgot-password

POST /auth/reset-password

Frontend pages

/forgot-password

/reset-password?token=...




++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Ignore this section for now

    4) Deployment + environments (dev + prod, plus recommended staging)
    Environments

    dev: local machine

    prod: real users

    staging (recommended): test production-like behavior safely

    Minimum you should do

    Separate .env configs

    Separate databases (never point dev at prod DB)

    Hosting choices

    Backend + DB

    Managed (easier ops): Railway, Render (DB add-on), DigitalOcean Managed DB, PlanetScale-like MySQL platforms

    VPS (more control): DigitalOcean droplet / AWS EC2 with MySQL installed

    CTO recommendation for first launch

    If you want easiest: managed backend + managed DB

    If you want cost-control + learning: VPS + managed DB (or VPS DB with backups configured)

    Frontend

    Vercel / Netlify are perfect for React apps:

    fast deploys

    previews

    easy env vars

    Domain + SSL

    Use a domain

    SSL via:

    Vercel/Netlify built-in for frontend

    Reverse proxy (nginx/caddy) or platform SSL for backend

    5) Non-functional baselines (must decide)
    A) Backups

    What you decide

    Frequency: daily (minimum)

    Retention: 7–30 days

    Where stored: provider backups or offsite object storage

    CTO recommendation

    Daily backups, 14-day retention for MVP

    Test restore once early

    B) Monitoring + logs

    Minimum monitoring

    /health endpoint (checks server up)

    Uptime checker pings it every minute (UptimeRobot works)

    Logs capture:

    request_id

    endpoint

    status code

    latency

    errors with stack (not in response)

    Nice to add

    Sentry for backend + frontend error tracking

    C) Rate limiting on login

    Why: brute force attempts happen even on small apps.

    Policy example

    POST /auth/login: max 5–10 attempts per IP per 10–15 minutes

    optionally also track per email identifier

    Add-ons

    temporary lockout after repeated failures

    CAPTCHA later if needed

Ignore this section for now
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++