const API_URL = 'http://localhost:3000/api';
let adminToken = '';
let userToken = '';
let userId = 0;
let eventId = 0;
let ticketToken = '';

const email = `testuser_${Date.now()}@example.com`;
const password = 'password123';

async function runTest() {
  console.log('Starting E2E Test...');

  // 1. Admin Login
  console.log('1. Admin Login...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'admin' }),
  });
  
  if (!loginRes.ok) throw new Error('Admin login failed');
  const loginData = await loginRes.json() as any;
  adminToken = loginData.token;
  console.log('   Admin logged in.');

  // 2. Admin Invites User
  console.log('2. Admin Invites User...');
  const inviteRes = await fetch(`${API_URL}/admin/invites`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ email, role: 'MEMBER', name: 'Test User' }),
  });

  if (!inviteRes.ok) throw new Error('Invite failed');
  const inviteData = await inviteRes.json() as any;
  const inviteLink = inviteData.inviteLink;
  const token = inviteLink.split('token=')[1];
  console.log('   Invite sent.');

  // 3. User Accepts Invite
  console.log('3. User Accepts Invite...');
  const acceptRes = await fetch(`${API_URL}/invites/${token}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, name: 'Test User' }),
  });

  if (!acceptRes.ok) throw new Error('Accept invite failed');
  console.log('   Invite accepted.');

  // 4. User Logs In
  console.log('4. User Logs In...');
  const userLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!userLoginRes.ok) throw new Error('User login failed');
  const userLoginData = await userLoginRes.json() as any;
  userToken = userLoginData.token;
  userId = userLoginData.user.id;
  console.log('   User logged in.');

  // 5. Create Event (as Admin)
  console.log('5. Create Event...');
  const eventRes = await fetch(`${API_URL}/admin/content`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: 'E2E Test Event',
      body: 'This is a test event',
      type: 'EVENT',
      visibility: 'MEMBER',
      status: 'PUBLISHED',
      event: {
        start_at: new Date().toISOString(),
        end_at: new Date(Date.now() + 3600000).toISOString(),
        location: 'Test Location'
      }
    }),
  });

  if (!eventRes.ok) throw new Error('Create event failed');
  const eventData = await eventRes.json() as any;
  eventId = eventData.id;
  console.log('   Event created.');

  // 6. Issue Ticket (as Admin)
  console.log('6. Issue Ticket...');
  const issueRes = await fetch(`${API_URL}/admin/events/${eventId}/tickets`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ userIds: [userId] }),
  });

  if (!issueRes.ok) throw new Error('Issue ticket failed');
  console.log('   Ticket issued.');

  // 7. User Gets Ticket
  console.log('7. User Fetches Tickets...');
  const ticketsRes = await fetch(`${API_URL}/tickets/my-tickets`, {
    headers: { 'Authorization': `Bearer ${userToken}` },
  });

  if (!ticketsRes.ok) throw new Error('Fetch tickets failed');
  const tickets = await ticketsRes.json() as any;
  const ticket = tickets.find((t: any) => t.event_id === eventId);
  if (!ticket) throw new Error('Ticket not found');
  ticketToken = ticket.token;
  console.log('   Ticket found.');

  // 8. Staff Scans Ticket
  console.log('8. Staff Scans Ticket...');
  const scanRes = await fetch(`${API_URL}/staff/check-in`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}` // Admin is also staff
    },
    body: JSON.stringify({ ticketToken, eventId }),
  });

  if (!scanRes.ok) {
    const err = await scanRes.json() as any;
    throw new Error(`Scan failed: ${err.reason}`);
  }
  const scanData = await scanRes.json() as any;
  console.log(`   Scan successful for ${scanData.memberName}`);

  console.log('SUCCESS: Full flow completed!');
}

runTest().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
