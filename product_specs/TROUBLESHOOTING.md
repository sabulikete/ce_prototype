# Troubleshooting Guide - Events Not Showing in UI

## Issue: Events exist in Database but don't show in UI

### Quick Fix Steps:

1. **Open the app**: `index.html` should be open in your browser
2. **Open Browser Console**: Press `F12` or `Cmd+Option+I` (Mac)
3. **Login as Events Admin**: Click the "Events Admin" demo button
4. **Check Console Output**: You should see:
   ```
   renderEventsDashboard called, events: Array(3)
   eventsHTML length: [some number]
   ```

### What the Console Logs Tell You:

#### ✅ If you see `events: Array(3)`:
- The Database has 3 events loaded correctly
- The events are: Summer Music Festival, Tech Conference 2025, Community Meetup

#### ❌ If you see `events: Array(0)` or `events: []`:
- The Database events array is empty
- **Solution**: Refresh the page - the Database should initialize with 3 default events

#### ❌ If you see `events: undefined`:
- The Database object isn't loading
- **Solution**: Check that `app.js` is loading correctly (check Network tab in DevTools)

### Step-by-Step Debugging:

#### Step 1: Verify Database Initialization
Open browser console and type:
```javascript
Database.events
```
You should see an array with 3 events.

#### Step 2: Manually Trigger View Render
In the console, type:
```javascript
loadView('events-dashboard')
```
This should force the events dashboard to re-render.

#### Step 3: Check if Events Render Function Works
In the console, type:
```javascript
console.log(renderEventsDashboard())
```
You should see HTML output with event cards.

#### Step 4: Create a Test Event
In the console, type:
```javascript
Database.events.push({
    id: 'evt_test',
    name: 'Test Event',
    date: '2025-12-25',
    time: '10:00',
    venue: 'Test Venue',
    capacity: 100,
    description: 'Test event',
    status: 'upcoming',
    ticketsSold: 0,
    createdAt: new Date().toISOString()
});
loadView('events-dashboard');
```
The test event should now appear in the UI.

### Common Issues & Solutions:

#### Issue 1: Page Loads but Events Dashboard is Blank
**Symptoms**: You see the sidebar and header, but the events grid is empty

**Solution**:
1. Open console (F12)
2. Look for the console.log output
3. If you see `events: Array(3)` but no events display, there might be a rendering issue
4. Try refreshing the page (Cmd+R or Ctrl+R)

#### Issue 2: "No events found" Message Shows
**Symptoms**: You see "No events found. Create your first event!"

**Solution**:
1. Check console: `Database.events.length`
2. If it returns 0, the Database didn't initialize
3. Refresh the page
4. If still 0, check that app.js is loading (Network tab in DevTools)

#### Issue 3: Created Event Doesn't Appear
**Symptoms**: You create an event, see success alert, but event doesn't show

**Solution**:
1. Check console logs after creating event
2. You should see `renderEventsDashboard called` with the new event
3. If not, try manually calling: `loadView('events-dashboard')`
4. Check that the event was added: `Database.events`

#### Issue 4: Events Show in Debug Page but Not Main App
**Symptoms**: debug.html shows events, but index.html doesn't

**Solution**:
1. The Database is working fine
2. Issue is with the view rendering
3. In main app console, type: `loadView('events-dashboard')`
4. Check for JavaScript errors in console

### Manual Reset:

If nothing works, reset the Database:
```javascript
// In browser console:
Database.events = [
    {
        id: 'evt_001',
        name: 'Summer Music Festival',
        date: '2025-07-15',
        time: '18:00',
        venue: 'Central Park Amphitheater',
        capacity: 500,
        description: 'Annual summer music festival',
        status: 'active',
        ticketsSold: 450,
        createdAt: '2025-06-01T10:00:00Z'
    },
    {
        id: 'evt_002',
        name: 'Tech Conference 2025',
        date: '2025-08-20',
        time: '09:00',
        venue: 'Convention Center Hall A',
        capacity: 300,
        description: 'Technology conference',
        status: 'active',
        ticketsSold: 230,
        createdAt: '2025-06-15T14:00:00Z'
    },
    {
        id: 'evt_003',
        name: 'Community Meetup',
        date: '2025-06-10',
        time: '15:00',
        venue: 'Community Center',
        capacity: 150,
        description: 'Monthly community gathering',
        status: 'upcoming',
        ticketsSold: 0,
        createdAt: '2025-05-20T09:00:00Z'
    }
];
loadView('events-dashboard');
```

### What to Report:

If you're still having issues, please provide:
1. What you see in the console when you type: `Database.events`
2. What you see in the console when you type: `Database.events.length`
3. Any error messages in the console (red text)
4. Screenshot of what you see in the Events Dashboard

### Expected Behavior:

When working correctly, you should see:
1. **Login Screen** → Click "Events Admin"
2. **Dashboard** → Shows with sidebar navigation
3. **Events Dashboard** (first view) → Shows 3 event cards:
   - Summer Music Festival (450/500 tickets)
   - Tech Conference 2025 (230/300 tickets)
   - Community Meetup (0/150 tickets)
4. Each event card has:
   - Event name and status badge
   - Date and ticket count
   - Progress bar
   - "View Details" and "Generate QR" buttons
