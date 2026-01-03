# Quickstart: Memorandum Post Type

**Feature**: Memorandum Post Type  
**Branch**: `001-memorandum-post-type`  
**Audience**: Admins

## Overview

Memorandum posts are a special content type that automatically enforces member-only visibility. This guide walks you through creating, editing, and verifying memorandum behavior.

## Prerequisites

- Admin account with access to Content Management page
- Active database connection
- Server running with authentication enabled

## Quick Steps

### 1. Create a Memorandum Post

**Navigate to Content Management**
1. Log in as an Admin
2. Go to Admin → Content Management
3. Click "New Post" button

**Configure Memorandum**
1. Select **Type**: "Memorandum" from dropdown
2. Notice: Visibility automatically sets to "Member Only" and becomes disabled
3. Helper note appears: "Memorandum posts are member-only"
4. Fill in:
   - **Title**: Your memorandum title
   - **Content**: Your message
   - **Status**: Published (or Draft for later)
5. Click "Save"

**Expected Result**: Post is created with `type=MEMO` and `visibility=MEMBER`

---

### 2. Edit an Existing Memorandum

**Open for Edit**
1. Find your memorandum in the posts list
2. Click the Edit icon (pencil)

**Verify Behavior**
- Type is set to "Memorandum" (disabled - cannot be changed during edit)
- Visibility is "Member Only" and disabled
- Helper note is displayed
- All other fields are editable

**Make Changes**
1. Update title, content, or status as needed
2. Click "Save"

**Expected Result**: Changes persist; visibility remains member-only

---

### 3. Convert Existing Post to Memorandum

**Edit Non-Memorandum Post**
1. Open any Announcement or Event for editing
2. Change **Type** to "Memorandum"

**Observe Behavior**
- Visibility immediately updates to "Member Only"
- Visibility select becomes disabled
- Helper note appears
- Previous visibility setting is stored

**Save Changes**
1. Click "Save"

**Expected Result**: Post is now member-only; type and visibility updated

---

### 4. Revert Memorandum to Another Type

**Edit Memorandum Post**
1. Open a memorandum for editing
2. Change **Type** from "Memorandum" to "Announcement" or "Event"

**Observe Behavior**
- Visibility select is re-enabled
- Visibility restores to previous non-memorandum value (or "Public" by default)
- Helper note disappears

**Save Changes**
1. Adjust visibility if needed
2. Click "Save"

**Expected Result**: Post reverts to chosen type with selected visibility

---

### 5. Verify Member-Only Access

**Test as Guest**
1. Log out or use incognito browser
2. Try accessing memorandum post detail URL directly

**Expected Result**: 404 Not Found (content is hidden from guests)

**Test as Member**
1. Log in as a Member user
2. Navigate to content list or detail page
3. View memorandum post

**Expected Result**: Content displays normally for authenticated members

**Test List Filtering**
1. As Guest: List excludes member-only memorandum posts
2. As Member: List includes memorandum posts
3. As Admin: All posts visible in admin panel

---

## Filter by Memorandum

**In Content Management**
1. Click the "Memorandum" filter button
2. Only memorandum posts are displayed

**Expected Result**: Filter shows only posts with `type=MEMO`

---

## Accessibility Features

**Disabled Control**
- Hover over disabled Visibility select when type is Memorandum
- Tooltip appears: "Memorandum posts are always member-only"
- Screen readers announce: "Visibility (disabled for Memorandum - always member-only)"

---

## Troubleshooting

### Visibility doesn't auto-set when selecting Memorandum
- **Check**: Browser console for JavaScript errors
- **Verify**: Form data state is updating correctly
- **Solution**: Refresh page and try again

### Guest can still access memorandum post
- **Check**: Post visibility is set to MEMBER in database
- **Verify**: Server authentication middleware is active
- **Solution**: Ensure `authenticate` middleware is applied to content routes

### Visibility not restoring when reverting from Memorandum
- **Check**: Previous visibility value was set before changing to Memorandum
- **Default Behavior**: Restores to PUBLIC if no previous non-MEMO visibility exists
- **Solution**: This is expected behavior

---

## API Endpoints Used

- `POST /admin/content` - Create memorandum
- `PUT /admin/content/:id` - Update memorandum
- `GET /content` - List content (with role-based filtering)
- `GET /content/:id` - Detail view (returns 404 for unauthorized)

---

## Database Schema Reference

**ContentType Enum**
- `ANNOUNCEMENT`
- `EVENT`
- `MEMO` (backend representation of "Memorandum")

**Visibility Enum**
- `PUBLIC`
- `MEMBER` (enforced for MEMO type)

**ContentStatus Enum**
- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

---

## Next Steps

- Review [spec.md](spec.md) for detailed requirements
- Check [plan.md](plan.md) for technical architecture
- See [tasks.md](tasks.md) for implementation details
- Consult [data-model.md](data-model.md) for entity relationships (if available)

---

## Notes

- Type changes are tracked and previous visibility is restored intelligently
- Server-side enforcement ensures security even if UI is bypassed
- 404 responses prevent content enumeration by unauthorized users
- All memorandum posts are member-only by design - no exceptions
