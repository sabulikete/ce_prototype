Member Portal – Spec v1 (Finalized)

This document is high-level but execution-ready.
You should not need to redesign anything mid-build if you follow this.

1) Final Data Model (MySQL)
users
id BIGINT PK AUTO
name VARCHAR(255)
email VARCHAR(255) UNIQUE
password_hash VARCHAR(255)
role ENUM('ADMIN','MEMBER')
created_at DATETIME
updated_at DATETIME

posts
id BIGINT PK AUTO
title VARCHAR(255)
content TEXT
type ENUM('announcement','event','memo')
visibility ENUM('public','member')
status ENUM('draft','published','archived')
is_pinned BOOLEAN DEFAULT false

event_start_at DATETIME NULL
event_end_at DATETIME NULL
location VARCHAR(255) NULL

created_by BIGINT FK -> users.id
updated_by BIGINT FK -> users.id
created_at DATETIME
updated_at DATETIME


Indexes

(status, visibility, created_at)

(type, status)

(is_pinned, created_at)

(event_start_at) for upcoming events

invites
id BIGINT PK AUTO
email VARCHAR(255)
token_hash VARCHAR(255)
expires_at DATETIME
used_at DATETIME NULL
created_by BIGINT FK -> users.id
created_at DATETIME

password_resets
id BIGINT PK AUTO
user_id BIGINT FK -> users.id
token_hash VARCHAR(255)
expires_at DATETIME
used_at DATETIME NULL
created_at DATETIME

2) Content Rules (System Behavior)
Status rules
Status	Visible to	Notes
Draft	Admin only	Not in public/member lists
Published	Public / Member	Based on visibility
Archived	Admin only	Hidden by default
Visibility rules

Public → Guests + Members

Member → Members + Admins only

Pinning rules

Only applies to published posts

Sorting rule:

ORDER BY is_pinned DESC, created_at DESC

Event rules

type = 'event' requires:

event_start_at

event_end_at must be >= start (if provided)

“Upcoming events”:

WHERE event_start_at >= NOW()

3) Roles & Permissions (Final Matrix)
Action	Guest	Member	Admin
View public posts	✅	✅	✅
View member posts	❌	✅	✅
View drafts/archived	❌	❌	✅
Create/edit/delete posts	❌	❌	✅
Pin posts	❌	❌	✅
Invite users	❌	❌	✅
Reset user password	❌	❌	✅

Backend enforces all rules.

4) API Contract (Final)
Auth
POST   /api/v1/auth/login
GET    /api/v1/auth/me
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

Invite flow
POST   /api/v1/admin/invites        (admin)
GET    /api/v1/auth/invite/:token   (public)
POST   /api/v1/auth/invite/accept   (public)

Public posts
GET /api/v1/posts
GET /api/v1/posts/:id


Rules:

Only published + public

Pagination default limit=20

Member posts
GET /api/v1/member/posts


Rules:

published + (public or member)

Admin posts
GET    /api/v1/admin/posts
POST   /api/v1/admin/posts
PUT    /api/v1/admin/posts/:id
DELETE /api/v1/admin/posts/:id


Admin can filter by:

status

type

visibility

pinned

5) Security Model (Locked)
Authentication

JWT access token (30–60 min expiry)

bcrypt password hashing

Authorization: Bearer <token>

Rate limiting

Login: max 5–10 attempts / 15 min per IP

Reset password: limited similarly

Token handling

Invite & reset tokens:

random

hashed in DB

single-use

expiry enforced

6) Frontend Route Map
Public
/                  Home
/login             Login
/posts/:id         Public post
/forgot-password
/reset-password
/invite/:token

Member
/member
/member/posts/:id

Admin
/admin
/admin/posts
/admin/posts/new
/admin/posts/:id/edit
/admin/invites

7) Deployment & Environments
Environments

dev – local

prod – live users

Hosting (recommended)

Frontend: Vercel / Netlify

Backend: Managed platform or VPS

DB: Managed MySQL (with backups enabled)

Required endpoints
GET /health

8) Non-Functional Baselines (Final)
Backups

Daily MySQL backups

14-day retention

Test restore once

Monitoring

Uptime check on /health

Backend logs (request_id, status, latency)

Error tracking (Sentry recommended)

Performance

Pagination everywhere

Proper DB indexes

No N+1 queries

9) Definition of Done (MVP)

You are MVP-complete when:

Admin can invite users

Invited user can set password and log in

Admin can create draft → publish → archive posts

Pinned announcements appear at top

Events show upcoming/past correctly

Members see member-only content

Guests never see private or draft content

Backups + monitoring are active