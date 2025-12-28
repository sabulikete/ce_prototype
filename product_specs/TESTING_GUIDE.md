# Quick Testing Guide for Event Functionality

## Test Scenario 1: Generate and Scan Tickets

### Step 1: Login
1. Open the application in your browser
2. Click the **"Events Admin"** demo button
3. You should see the Events Dashboard

### Step 2: View Existing Events
1. You should see 3 pre-loaded events:
   - Summer Music Festival (450/500 tickets sold)
   - Tech Conference 2025 (230/300 tickets sold)
   - Community Meetup (0/150 tickets sold)

### Step 3: Generate Tickets
1. Click on **"Generate QR Codes"** in the sidebar
2. Select **"Summer Music Festival"** from the dropdown
3. Enter **3** for number of tickets
4. (Optional) Enter an email address
5. Click **"Generate QR Codes"**
6. You should see:
   - A summary showing tickets generated
   - 3 QR codes with ticket details
   - Each ticket shows: Event name, date, QR code, ticket ID, token, and status

### Step 4: Copy a Ticket Code
1. Look at one of the generated tickets
2. Find the "Token" field (it shows something like: `tok_abc123...`)
3. To get the full QR data, you need the format: `evt_001|tok_xxxxx`
4. For Summer Music Festival, the eventId is `evt_001`
5. Copy the full token from the ticket

### Step 5: Test Check-in
1. Click on **"Scan QR Codes"** in the sidebar
2. In the "Manual Entry" section at the bottom
3. Enter the ticket code in format: `evt_001|tok_xxxxxxxxxxxxx`
   - Replace the `tok_xxxxx` part with the actual token from your ticket
4. Click **"Check In"**
5. You should see a **SUCCESS** modal with:
   - ✅ Green checkmark
   - "Valid - Entry allowed" message
   - Event name, ticket ID, attendee info
   - Timestamp

### Step 6: Test Duplicate Prevention
1. Click "Continue" to close the modal
2. Enter the **same ticket code** again
3. Click **"Check In"**
4. You should see an **ERROR** modal with:
   - ❌ Red X
   - "Ticket already used" message
   - Details showing when and where it was previously used

## Test Scenario 2: Create a New Event

### Step 1: Navigate to Create Event
1. From the sidebar, click **"Create Event"**

### Step 2: Fill Out the Form
1. **Event Name**: "Test Concert 2025"
2. **Event Date**: Select a future date
3. **Event Time**: "19:00"
4. **Venue**: "Test Arena"
5. **Capacity**: "100"
6. **Description**: "This is a test event"

### Step 3: Submit
1. Click **"Create Event"**
2. You should see an alert: "Event created successfully!"
3. You'll be redirected to the Events Dashboard
4. Your new event should appear in the list

### Step 4: Generate Tickets for New Event
1. Click **"Generate QR"** on your new event
2. Generate 5 tickets
3. Test check-in with one of them

## Test Scenario 3: View Event Details

### Step 1: View Statistics
1. Go to **"Events Dashboard"**
2. Click **"View Details"** on any event
3. You should see a modal with:
   - Event information (date, venue, description)
   - Statistics (capacity, tickets sold, check-ins, unused tickets)

## Expected Behaviors

### ✅ What Should Work:
- Generating tickets creates unique tokens
- Each QR code is unique and scannable
- First scan of a valid ticket → Success
- Second scan of same ticket → "Already Used" error
- Invalid ticket format → "Invalid QR code format" error
- Non-existent ticket → "Ticket not found" error
- Event statistics update after ticket generation
- Check-in list shows recent check-ins

### ❌ What Should Fail:
- Scanning invalid format (e.g., "abc123") → Error
- Scanning already-used ticket → "Already Used"
- Scanning ticket for wrong event → "Ticket not found"
- Generating tickets for sold-out event → Error message

## Quick Ticket Code Examples

For testing, here are the event IDs:
- Summer Music Festival: `evt_001`
- Tech Conference 2025: `evt_002`
- Community Meetup: `evt_003`

Format: `eventId|token`
Example: `evt_001|tok_abc123def456ghi789`

## Troubleshooting

**If QR codes don't appear:**
- Check browser console for errors
- Ensure qrcode.js library is loaded
- Refresh the page

**If check-in doesn't work:**
- Make sure you're using the correct format: `eventId|token`
- Check that you copied the full token
- Verify you're logged in as Events Admin

**If modals don't close:**
- Click outside the modal
- Click the "Close" or "Continue" button
- Refresh the page if stuck

## Browser Console Testing

You can also test directly in the browser console:

```javascript
// Generate a ticket
const result = Database.createTicket('evt_001', 'test@example.com');
console.log(result);

// Check in a ticket
const checkin = Database.checkin('evt_001|tok_xxxxx');
console.log(checkin);

// View event stats
const stats = Database.getEventStats('evt_001');
console.log(stats);

// View all tickets
console.log(Database.tickets);

// View all check-ins
console.log(Database.checkins);
```

Enjoy testing the event management system! 🎉
