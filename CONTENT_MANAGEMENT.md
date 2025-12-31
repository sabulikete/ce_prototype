# CE App - Content Management System

## ✅ Implementation Summary

This document describes the **Content Management System** that has been implemented according to the product specifications.

## Architecture Overview

### Database Model (Unified `posts` table)
Following the product spec, we use a single `posts` table with the following schema:

```sql
posts
├── id (PK)
├── title
├── content
├── type (ENUM: 'announcement', 'event', 'memo')
├── visibility (ENUM: 'public', 'member')
├── status (ENUM: 'draft', 'published', 'archived')
├── is_pinned (BOOLEAN)
├── event_start_at (DATETIME, nullable)
├── event_end_at (DATETIME, nullable)
├── location (VARCHAR, nullable)
├── created_by (FK to users.id)
├── updated_by (FK to users.id)
├── created_at (DATETIME)
└── updated_at (DATETIME)
```

**Indexes:**
- (status, visibility, created_at)
- (type, status)
- (is_pinned, created_at)
- (event_start_at)

## Content Rules

### Status Rules
| Status | Visible To | Notes |
|--------|-----------|-------|
| Draft | Admin only | Not in public/member lists |
| Published | Public/Member | Based on visibility |
| Archived | Admin only | Hidden by default |

### Visibility Rules
- **public** → Guests + Members + Admins
- **member** → Members + Admins only

### Pinning Rules
- Only applies to published posts
- Sorting: `ORDER BY is_pinned DESC, created_at DESC`

### Event Rules
- `type = 'event'` requires `event_start_at`
- `event_end_at` must be >= `event_start_at` (if provided)
- "Upcoming events": `WHERE event_start_at >= NOW()`

## API Endpoints

### GET /api/posts
List posts with filtering

**Query Parameters:**
- `type` - Filter by type (announcement, event, memo)
- `visibility` - Filter by visibility (public, member)
- `status` - Filter by status (draft, published, archived)
- `upcoming` - For events, filter upcoming only (true/false)

**Example:**
```
GET /api/posts?type=event&visibility=public&upcoming=true
GET /api/posts?type=announcement&visibility=member
```

### POST /api/posts
Create a new post

**Request Body:**
```json
{
  "title": "Community BBQ",
  "content": "Join us for a summer BBQ!",
  "type": "event",
  "visibility": "public",
  "status": "published",
  "is_pinned": false,
  "event_start_at": "2025-09-15T18:00:00",
  "event_end_at": "2025-09-15T21:00:00",
  "location": "Community Park"
}
```

### PATCH /api/posts/:id
Update a post (e.g., toggle pin, change status)

### DELETE /api/posts/:id
Delete a post

## Frontend Pages

### 1. Admin Content Manager (`/admin/posts`)
**Features:**
- ✅ Tabbed interface (Announcements, Events, Memos)
- ✅ Create posts with full control:
  - Type selection
  - Visibility (Public/Members Only)
  - Status (Published/Draft/Archived)
  - Pin toggle
  - Event-specific fields (dates, location)
- ✅ View all posts with badges showing:
  - Visibility (Public/Members)
  - Status (Draft/Archived)
  - Pin status
- ✅ Toggle pin status
- ✅ Delete posts

### 2. Public Landing Page (`/`)
**Features:**
- ✅ Displays PUBLIC announcements
- ✅ Displays PUBLIC upcoming events
- ✅ Real-time data from database
- ✅ Responsive glassmorphism design

### 3. Member Dashboard (To be implemented)
**Features:**
- View MEMBER + PUBLIC announcements
- View MEMBER + PUBLIC events
- Pinned posts appear first

## Permissions Matrix

| Action | Guest | Member | Admin |
|--------|-------|--------|-------|
| View public posts | ✅ | ✅ | ✅ |
| View member posts | ❌ | ✅ | ✅ |
| View drafts/archived | ❌ | ❌ | ✅ |
| Create/edit/delete posts | ❌ | ❌ | ✅ |
| Pin posts | ❌ | ❌ | ✅ |

## Usage Examples

### Creating a Public Announcement
1. Login as Admin
2. Navigate to **Content** in sidebar
3. Click **Announcements** tab
4. Click **New Announcement**
5. Fill in:
   - Title: "Pool Maintenance"
   - Content: "The pool will be closed for maintenance..."
   - Visibility: **Public**
   - Status: **Published**
6. Click **Publish**

### Creating a Members-Only Event
1. Login as Admin
2. Navigate to **Content** in sidebar
3. Click **Events** tab
4. Click **New Event**
5. Fill in:
   - Title: "HOA Meeting"
   - Content: "Monthly meeting agenda..."
   - Start Date: Select date/time
   - Location: "Clubhouse"
   - Visibility: **Members Only**
   - Status: **Published**
6. Click **Publish**

### Pinning Important Posts
1. Find the post in the list
2. Click the **Pin** icon
3. Post will now appear at the top of all lists

## Testing Checklist

- [ ] Create public announcement → Verify it appears on Landing Page
- [ ] Create member announcement → Verify it does NOT appear on Landing Page
- [ ] Create public event → Verify it appears on Landing Page
- [ ] Create member event → Verify it does NOT appear on Landing Page
- [ ] Pin a post → Verify it appears first in the list
- [ ] Create draft → Verify it's not visible to guests/members
- [ ] Archive a post → Verify it's hidden from public view
- [ ] Delete a post → Verify it's removed from database

## Next Steps

1. **Member Dashboard**: Create a member-facing page to view member + public posts
2. **Post Details**: Add individual post detail pages
3. **Rich Text Editor**: Upgrade content field to support formatting
4. **Image Uploads**: Allow admins to attach images to posts
5. **Email Notifications**: Send emails when new posts are published
6. **Comments**: Allow members to comment on posts
7. **RSVP System**: For events, allow members to RSVP

## Files Modified/Created

### Backend
- `server/src/models/Post.js` - Unified post model
- `server/src/routes/postRoutes.js` - API routes
- `server/src/index.js` - Route registration

### Frontend
- `client/src/pages/Admin/AdminPosts.jsx` - Admin content manager
- `client/src/pages/Admin/AdminPosts.css` - Styling
- `client/src/pages/LandingPage.jsx` - Updated to use posts API
- `client/src/App.jsx` - Route configuration
- `client/src/components/Layout/Sidebar.jsx` - Navigation link

## Database Migration Notes

If you had existing `events` and `announcements` tables, they have been replaced with the unified `posts` table. The server automatically creates the new schema on restart.
