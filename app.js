// ========================================
// CE APP - MAIN APPLICATION LOGIC
// ========================================

// === STATE MANAGEMENT ===
const AppState = {
    currentUser: null,
    currentRole: null,
    currentView: 'login',
    sidebarCollapsed: false,
    notifications: [],
    // Event Management State
    events: [],
    tickets: [],
    checkins: [],
    scannerActive: false
};

// === DATABASE SIMULATION ===
// Simulates backend database for events and tickets
const Database = {
    events: [
        {
            id: 'evt_001',
            name: 'Summer Music Festival',
            date: '2025-07-15',
            time: '18:00',
            venue: 'Central Park Amphitheater',
            capacity: 500,
            description: 'Annual summer music festival featuring local and international artists',
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
            description: 'Technology conference with keynote speakers and workshops',
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
            description: 'Monthly community gathering and networking event',
            status: 'upcoming',
            ticketsSold: 0,
            createdAt: '2025-05-20T09:00:00Z'
        }
    ],

    tickets: [
        // Format: { ticketId, eventId, userId, token, tokenHash, status, createdAt, usedAt, gateId }
    ],

    checkins: [
        // Format: { checkinId, ticketId, eventId, timestamp, gateId, deviceId, status }
    ],

    // Generate unique ticket token
    generateToken() {
        return 'tok_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },

    // Hash token (simplified - in production use proper crypto)
    hashToken(token) {
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            const char = token.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(16);
    },

    // Create ticket
    createTicket(eventId, userId = null) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) {
            return { success: false, error: 'Event not found' };
        }

        if (event.ticketsSold >= event.capacity) {
            return { success: false, error: 'Event is sold out' };
        }

        const token = this.generateToken();
        const ticketId = 'ticket_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

        const ticket = {
            ticketId,
            eventId,
            userId: userId || 'guest_' + Math.random().toString(36).substring(2, 9),
            token,
            tokenHash: this.hashToken(token),
            qrData: `${eventId}|${token}`,
            status: 'unused',
            createdAt: new Date().toISOString(),
            usedAt: null,
            gateId: null,
            expiresAt: event.date + 'T23:59:59Z'
        };

        this.tickets.push(ticket);
        event.ticketsSold++;

        return { success: true, ticket };
    },

    // Validate and check-in ticket
    checkin(qrData, gateId = 'gate_01', deviceId = 'device_01') {
        const timestamp = new Date().toISOString();

        // Parse QR data
        const parts = qrData.split('|');
        if (parts.length !== 2) {
            return {
                success: false,
                status: 'invalid',
                message: 'Invalid QR code format',
                timestamp
            };
        }

        const [eventId, token] = parts;

        // Find ticket
        const ticket = this.tickets.find(t => t.token === token && t.eventId === eventId);

        if (!ticket) {
            return {
                success: false,
                status: 'not_found',
                message: 'Ticket not found',
                timestamp
            };
        }

        // Find event
        const event = this.events.find(e => e.id === eventId);
        if (!event) {
            return {
                success: false,
                status: 'invalid_event',
                message: 'Event not found',
                timestamp
            };
        }

        // Check if expired
        const now = new Date();
        const expiryDate = new Date(ticket.expiresAt);
        if (now > expiryDate) {
            return {
                success: false,
                status: 'expired',
                message: 'Ticket has expired',
                timestamp,
                ticket,
                event
            };
        }

        // Check if already used (atomic check)
        if (ticket.status === 'used') {
            return {
                success: false,
                status: 'already_used',
                message: 'Ticket already used',
                timestamp,
                ticket,
                event,
                usedAt: ticket.usedAt,
                usedGate: ticket.gateId
            };
        }

        // Mark as used (atomic operation)
        ticket.status = 'used';
        ticket.usedAt = timestamp;
        ticket.gateId = gateId;

        // Create check-in log
        const checkin = {
            checkinId: 'checkin_' + Date.now(),
            ticketId: ticket.ticketId,
            eventId: event.id,
            timestamp,
            gateId,
            deviceId,
            status: 'valid',
            attendeeName: ticket.userId
        };

        this.checkins.push(checkin);

        return {
            success: true,
            status: 'valid',
            message: 'Valid - Entry allowed',
            timestamp,
            ticket,
            event,
            checkin
        };
    },

    // Get event statistics
    getEventStats(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return null;

        const eventTickets = this.tickets.filter(t => t.eventId === eventId);
        const usedTickets = eventTickets.filter(t => t.status === 'used');
        const eventCheckins = this.checkins.filter(c => c.eventId === eventId);

        return {
            event,
            totalTickets: eventTickets.length,
            usedTickets: usedTickets.length,
            unusedTickets: eventTickets.length - usedTickets.length,
            checkins: eventCheckins.length,
            capacity: event.capacity,
            available: event.capacity - event.ticketsSold
        };
    }
};

// === USER ROLES & NAVIGATION ===
const USER_ROLES = {
    super_admin: {
        name: 'Super Admin',
        navigation: [
            {
                section: 'Overview', items: [
                    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', view: 'dashboard' },
                    { id: 'analytics', label: 'Analytics', icon: 'chart', view: 'analytics' }
                ]
            },
            {
                section: 'Management', items: [
                    { id: 'users', label: 'User Management', icon: 'users', view: 'users' },
                    { id: 'roles', label: 'Role Management', icon: 'shield', view: 'roles' },
                    { id: 'permissions', label: 'Permissions', icon: 'lock', view: 'permissions' },
                    { id: 'audit', label: 'Audit Logs', icon: 'file', view: 'audit' }
                ]
            },
            {
                section: 'Systems', items: [
                    { id: 'events', label: 'Events System', icon: 'calendar', view: 'events' },
                    { id: 'billing', label: 'Billing System', icon: 'credit-card', view: 'billing' },
                    { id: 'settings', label: 'System Settings', icon: 'settings', view: 'settings' }
                ]
            }
        ]
    },
    events_admin: {
        name: 'Events Admin',
        navigation: [
            {
                section: 'Events', items: [
                    { id: 'events-dashboard', label: 'Events Dashboard', icon: 'dashboard', view: 'events-dashboard' },
                    { id: 'create-event', label: 'Create Event', icon: 'plus', view: 'create-event' },
                    { id: 'manage-events', label: 'Manage Events', icon: 'calendar', view: 'manage-events' }
                ]
            },
            {
                section: 'QR System', items: [
                    { id: 'generate-qr', label: 'Generate QR Codes', icon: 'qr', view: 'generate-qr' },
                    { id: 'scan-qr', label: 'Scan QR Codes', icon: 'scan', view: 'scan-qr' },
                    { id: 'qr-history', label: 'QR History', icon: 'history', view: 'qr-history' }
                ]
            },
            {
                section: 'Reports', items: [
                    { id: 'attendance', label: 'Attendance Reports', icon: 'users', view: 'attendance' },
                    { id: 'event-analytics', label: 'Event Analytics', icon: 'chart', view: 'event-analytics' }
                ]
            }
        ]
    },
    billing_admin: {
        name: 'Billing Admin',
        navigation: [
            {
                section: 'Billing', items: [
                    { id: 'billing-dashboard', label: 'Billing Dashboard', icon: 'dashboard', view: 'billing-dashboard' },
                    { id: 'upload-single', label: 'Upload Statement', icon: 'upload', view: 'upload-single' },
                    { id: 'upload-bulk', label: 'Bulk Upload', icon: 'folder', view: 'upload-bulk' }
                ]
            },
            {
                section: 'Management', items: [
                    { id: 'statements', label: 'All Statements', icon: 'file', view: 'statements' },
                    { id: 'invoices', label: 'Invoices', icon: 'receipt', view: 'invoices' },
                    { id: 'payments', label: 'Payments', icon: 'credit-card', view: 'payments' }
                ]
            },
            {
                section: 'Reports', items: [
                    { id: 'billing-reports', label: 'Billing Reports', icon: 'chart', view: 'billing-reports' },
                    { id: 'payment-history', label: 'Payment History', icon: 'history', view: 'payment-history' }
                ]
            }
        ]
    },
    user: {
        name: 'User',
        navigation: [
            {
                section: 'My Account', items: [
                    { id: 'user-dashboard', label: 'Dashboard', icon: 'dashboard', view: 'user-dashboard' },
                    { id: 'my-events', label: 'My Events', icon: 'calendar', view: 'my-events' },
                    { id: 'my-tickets', label: 'My Tickets', icon: 'ticket', view: 'my-tickets' }
                ]
            },
            {
                section: 'Billing', items: [
                    { id: 'my-statements', label: 'Billing Statements', icon: 'file', view: 'my-statements', badge: '3' },
                    { id: 'payment-methods', label: 'Payment Methods', icon: 'credit-card', view: 'payment-methods' }
                ]
            },
            {
                section: 'Settings', items: [
                    { id: 'profile', label: 'Profile', icon: 'user', view: 'profile' },
                    { id: 'notifications', label: 'Notifications', icon: 'bell', view: 'notifications' }
                ]
            }
        ]
    }
};

// === ICON SVG LIBRARY ===
const ICONS = {
    dashboard: '<path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    users: '<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    calendar: '<path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    'credit-card': '<path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3v-8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    chart: '<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    file: '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    plus: '<path d="M12 4v16m8-8H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    upload: '<path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    qr: '<path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    scan: '<path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    history: '<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    shield: '<path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    lock: '<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    settings: '<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    folder: '<path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    receipt: '<path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    ticket: '<path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    bell: '<path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    user: '<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
};

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    // Check for saved session
    const savedUser = localStorage.getItem('ce_app_user');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        loginUser(userData.role, userData.username);
    }
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Demo account buttons
    const demoButtons = document.querySelectorAll('.btn-demo');
    demoButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const role = e.target.dataset.role;
            loginUser(role, `Demo ${USER_ROLES[role].name}`);
        });
    });

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simple demo authentication - in production, this would call an API
    if (username && password) {
        loginUser('user', username);
    }
}

function loginUser(role, username) {
    AppState.currentUser = username;
    AppState.currentRole = role;

    // Save to localStorage
    localStorage.setItem('ce_app_user', JSON.stringify({ role, username }));

    // Update UI
    document.getElementById('user-name').textContent = username;
    document.getElementById('user-role').textContent = USER_ROLES[role].name;
    document.getElementById('user-avatar-text').textContent = username.charAt(0).toUpperCase();

    // Build navigation
    buildNavigation(role);

    // Switch to dashboard
    switchScreen('dashboard');

    // Load default view
    loadView(USER_ROLES[role].navigation[0].items[0].view);
}

function handleLogout() {
    AppState.currentUser = null;
    AppState.currentRole = null;
    localStorage.removeItem('ce_app_user');
    switchScreen('login');

    // Reset form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.reset();
    }
}

function switchScreen(screenName) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));

    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
    AppState.sidebarCollapsed = !AppState.sidebarCollapsed;
}

function buildNavigation(role) {
    const nav = document.getElementById('sidebar-nav');
    const navigation = USER_ROLES[role].navigation;

    let navHTML = '';
    navigation.forEach(section => {
        navHTML += `<div class="nav-section">`;
        navHTML += `<div class="nav-section-title">${section.section}</div>`;

        section.items.forEach(item => {
            const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
            navHTML += `
                <a href="#" class="nav-item" data-view="${item.view}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        ${ICONS[item.icon] || ICONS.dashboard}
                    </svg>
                    <span class="nav-item-text">${item.label}</span>
                    ${badge}
                </a>
            `;
        });

        navHTML += `</div>`;
    });

    nav.innerHTML = navHTML;

    // Add click handlers
    const navItems = nav.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.currentTarget.dataset.view;

            // Update active state
            navItems.forEach(ni => ni.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Load view
            loadView(view);
        });
    });

    // Set first item as active
    if (navItems.length > 0) {
        navItems[0].classList.add('active');
    }
}

// === VIEW RENDERING ===
function loadView(viewName) {
    const contentArea = document.getElementById('content-area');
    const views = {
        'dashboard': renderDashboard,
        'events-dashboard': renderEventsDashboard,
        'create-event': renderCreateEvent,
        'generate-qr': renderGenerateQR,
        'scan-qr': renderScanQR,
        'billing-dashboard': renderBillingDashboard,
        'upload-bulk': renderBulkUpload,
        'user-dashboard': renderUserDashboard,
        'my-statements': renderMyStatements,
        'my-tickets': renderMyTickets
    };

    const renderFunction = views[viewName] || renderDefaultView;
    contentArea.innerHTML = renderFunction(viewName);

    // Update header
    updateHeader(viewName);

    // Initialize view-specific functionality
    initializeViewFunctionality(viewName);
}

function updateHeader(viewName) {
    const titles = {
        'dashboard': { title: 'Dashboard', subtitle: 'System overview and analytics' },
        'events-dashboard': { title: 'Events Dashboard', subtitle: 'Manage and monitor all events' },
        'create-event': { title: 'Create Event', subtitle: 'Set up a new event with QR ticketing' },
        'generate-qr': { title: 'Generate QR Codes', subtitle: 'Create tickets for events' },
        'scan-qr': { title: 'Scan QR Codes', subtitle: 'Check-in attendees at the gate' },
        'billing-dashboard': { title: 'Billing Dashboard', subtitle: 'Manage billing and statements' },
        'upload-bulk': { title: 'Bulk Upload', subtitle: 'Upload multiple billing statements' },
        'user-dashboard': { title: 'My Dashboard', subtitle: 'Welcome back!' },
        'my-statements': { title: 'Billing Statements', subtitle: 'View and download your statements' },
        'my-tickets': { title: 'My Tickets', subtitle: 'Your event tickets and QR codes' }
    };

    const info = titles[viewName] || { title: 'Dashboard', subtitle: 'Welcome' };
    document.getElementById('page-title').textContent = info.title;
    document.getElementById('page-subtitle').textContent = info.subtitle;
}

function renderDashboard(viewName) {
    return `
        <div class="dashboard-grid">
            <div class="stats-grid">
                <div class="stat-card glass-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            ${ICONS.users}
                        </svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">Total Users</p>
                        <h3 class="stat-value">1,234</h3>
                        <p class="stat-change positive">+12% from last month</p>
                    </div>
                </div>
                
                <div class="stat-card glass-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            ${ICONS.calendar}
                        </svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">Active Events</p>
                        <h3 class="stat-value">42</h3>
                        <p class="stat-change positive">+5 new this week</p>
                    </div>
                </div>
                
                <div class="stat-card glass-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            ${ICONS.ticket}
                        </svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">Tickets Issued</p>
                        <h3 class="stat-value">8,567</h3>
                        <p class="stat-change positive">+23% this month</p>
                    </div>
                </div>
                
                <div class="stat-card glass-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            ${ICONS['credit-card']}
                        </svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">Revenue</p>
                        <h3 class="stat-value">$45,678</h3>
                        <p class="stat-change positive">+18% from last month</p>
                    </div>
                </div>
            </div>
            
            <div class="content-grid">
                <div class="glass-card">
                    <h2 class="card-title">Recent Activity</h2>
                    <div class="activity-list">
                        ${renderActivityItem('New event created: "Summer Festival 2025"', '2 hours ago', 'calendar')}
                        ${renderActivityItem('125 tickets sold for "Tech Conference"', '5 hours ago', 'ticket')}
                        ${renderActivityItem('Billing statements uploaded (45 files)', '1 day ago', 'file')}
                        ${renderActivityItem('New user registered: john@example.com', '2 days ago', 'users')}
                    </div>
                </div>
                
                <div class="glass-card">
                    <h2 class="card-title">Quick Actions</h2>
                    <div class="quick-actions">
                        <button class="action-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">${ICONS.plus}</svg>
                            <span>Create Event</span>
                        </button>
                        <button class="action-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">${ICONS.qr}</svg>
                            <span>Generate QR</span>
                        </button>
                        <button class="action-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">${ICONS.upload}</svg>
                            <span>Upload Files</span>
                        </button>
                        <button class="action-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">${ICONS.chart}</svg>
                            <span>View Reports</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderActivityItem(text, time, icon) {
    return `
        <div class="activity-item">
            <div class="activity-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    ${ICONS[icon]}
                </svg>
            </div>
            <div class="activity-content">
                <p class="activity-text">${text}</p>
                <p class="activity-time">${time}</p>
            </div>
        </div>
    `;
}

function renderEventsDashboard() {
    const events = Database.events;
    console.log('renderEventsDashboard called, events:', events);

    let eventsHTML = '';
    if (events && events.length > 0) {
        eventsHTML = events.map(event => {
            return renderEventCard(event.name, event.date, event.status, event.ticketsSold, event.capacity, event.id);
        }).join('');
    } else {
        eventsHTML = '<p class="empty-state">No events found. Create your first event!</p>';
    }

    console.log('eventsHTML length:', eventsHTML.length);

    return `
        <div class="events-dashboard">
            <div class="page-actions">
                <button class="btn btn-primary" onclick="loadView('create-event')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">${ICONS.plus}</svg>
                    <span>Create New Event</span>
                </button>
            </div>
            
            <div class="events-grid">
                ${eventsHTML}
            </div>
        </div>
    `;
}

function renderEventCard(name, date, status, sold, capacity, eventId) {
    const percentage = (sold / capacity * 100).toFixed(0);
    return `
        <div class="event-card glass-card">
            <div class="event-header">
                <h3>${name}</h3>
                <span class="event-status status-${status.toLowerCase()}">${status}</span>
            </div>
            <div class="event-details">
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Tickets:</strong> ${sold} / ${capacity}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <p class="progress-text">${percentage}% sold</p>
            </div>
            <div class="event-actions">
                <button class="btn btn-demo" onclick="viewEventDetails('${eventId}')">View Details</button>
                <button class="btn btn-demo" onclick="generateEventTickets('${eventId}')">Generate QR</button>
            </div>
        </div>
    `;
}

function renderCreateEvent() {
    return `
        <div class="create-event-form">
            <div class="glass-card form-container">
                <h2>Event Information</h2>
                <form id="event-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Event Name</label>
                            <input type="text" name="name" placeholder="Enter event name" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Event Date</label>
                            <input type="date" name="date" required>
                        </div>
                        <div class="form-group">
                            <label>Event Time</label>
                            <input type="time" name="time" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Venue</label>
                            <input type="text" name="venue" placeholder="Event location" required>
                        </div>
                        <div class="form-group">
                            <label>Capacity</label>
                            <input type="number" name="capacity" placeholder="Max attendees" min="1" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description" rows="4" placeholder="Event description"></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary btn-large">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">${ICONS.plus}</svg>
                            <span>Create Event</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function renderGenerateQR() {
    const events = Database.events;
    const eventOptions = events.map(event =>
        `<option value="${event.id}">${event.name} (${event.capacity - event.ticketsSold} available)</option>`
    ).join('');

    return `
        <div class="qr-generator">
            <div class="glass-card">
                <h2>Generate Event Tickets</h2>
                <form id="qr-form">
                    <div class="form-group">
                        <label>Select Event</label>
                        <select id="event-select" required>
                            <option value="">Choose an event...</option>
                            ${eventOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Number of Tickets</label>
                        <input type="number" id="ticket-count" min="1" max="100" value="1" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Attendee Email (Optional)</label>
                        <input type="email" id="attendee-email" placeholder="attendee@example.com">
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-large">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">${ICONS.qr}</svg>
                        <span>Generate QR Codes</span>
                    </button>
                </form>
            </div>
            
            <div class="glass-card" id="qr-output">
                <h2>Generated QR Codes</h2>
                <div id="qr-codes-container" class="qr-codes-grid">
                    <p class="empty-state">Generate tickets to see QR codes here</p>
                </div>
            </div>
        </div>
    `;
}

function renderScanQR() {
    const recentCheckins = Database.checkins.slice(-10).reverse(); // Last 10 check-ins
    const checkinsHTML = recentCheckins.length > 0
        ? recentCheckins.map(checkin => {
            const ticket = Database.tickets.find(t => t.ticketId === checkin.ticketId);
            const event = Database.events.find(e => e.id === checkin.eventId);
            const timeAgo = getTimeAgo(new Date(checkin.timestamp));
            return renderCheckinItem(
                ticket ? ticket.userId : 'Unknown',
                event ? event.name : 'Unknown Event',
                checkin.status === 'valid' ? 'Valid' : 'Invalid',
                timeAgo
            );
        }).join('')
        : '<p class="empty-state">No check-ins yet</p>';

    return `
        <div class="qr-scanner">
            <div class="glass-card">
                <h2>QR Code Scanner</h2>
                <div class="scanner-container">
                    <div class="scanner-frame" id="scanner-frame">
                        <div class="scanner-overlay">
                            <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                                <path d="M20 60V20H60M140 20H180V60M180 140V180H140M60 180H20V140" stroke="url(#scanner-gradient)" stroke-width="4" stroke-linecap="round"/>
                                <defs>
                                    <linearGradient id="scanner-gradient" x1="0" y1="0" x2="200" y2="200">
                                        <stop offset="0%" stop-color="#667eea"/>
                                        <stop offset="100%" stop-color="#764ba2"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                            <p id="scanner-status">Position QR code within frame</p>
                        </div>
                    </div>
                    
                    <div class="scanner-controls">
                        <button class="btn btn-primary btn-large" id="start-scan" onclick="startScanner()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">${ICONS.scan}</svg>
                            <span>Start Scanning</span>
                        </button>
                        
                        <div class="manual-entry" style="margin-top: 1rem;">
                            <p style="text-align: center; margin-bottom: 0.5rem; color: var(--text-secondary);">Or enter ticket code manually:</p>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="text" id="manual-qr-input" placeholder="evt_xxx|tok_xxx" style="flex: 1;">
                                <button class="btn btn-demo" onclick="scanManualCode()">Check In</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="glass-card">
                <h2>Recent Check-ins</h2>
                <div class="checkin-list" id="checkin-list">
                    ${checkinsHTML}
                </div>
            </div>
        </div>
    `;
}

function renderCheckinItem(name, event, status, time) {
    const statusClass = status === 'Valid' ? 'success' : 'danger';
    return `
        <div class="checkin-item">
            <div class="checkin-info">
                <p class="checkin-name">${name}</p>
                <p class="checkin-event">${event}</p>
            </div>
            <div class="checkin-status">
                <span class="status-badge status-${statusClass}">${status}</span>
                <p class="checkin-time">${time}</p>
            </div>
        </div>
    `;
}

function renderBillingDashboard() {
    return `
        <div class="billing-dashboard">
            <div class="stats-grid">
                <div class="stat-card glass-card">
                    <div class="stat-icon" style="background: var(--primary-gradient);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">${ICONS.file}</svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">Total Statements</p>
                        <h3 class="stat-value">1,456</h3>
                    </div>
                </div>
                
                <div class="stat-card glass-card">
                    <div class="stat-icon" style="background: var(--success-gradient);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">${ICONS['credit-card']}</svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">Paid This Month</p>
                        <h3 class="stat-value">$23,450</h3>
                    </div>
                </div>
                
                <div class="stat-card glass-card">
                    <div class="stat-icon" style="background: var(--warning-gradient);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">${ICONS.users}</svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">Active Users</p>
                        <h3 class="stat-value">892</h3>
                    </div>
                </div>
            </div>
            
            <div class="glass-card">
                <h2 class="card-title">Recent Uploads</h2>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Files</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>2025-12-15</td>
                                <td>Bulk Upload</td>
                                <td>45 files</td>
                                <td><span class="status-badge status-success">Completed</span></td>
                                <td><button class="btn btn-demo btn-sm">View</button></td>
                            </tr>
                            <tr>
                                <td>2025-12-10</td>
                                <td>Single Upload</td>
                                <td>1 file</td>
                                <td><span class="status-badge status-success">Completed</span></td>
                                <td><button class="btn btn-demo btn-sm">View</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderBulkUpload() {
    return `
        <div class="bulk-upload">
            <div class="glass-card">
                <h2>Bulk Statement Upload</h2>
                <div class="upload-instructions">
                    <h3>Upload Instructions:</h3>
                    <ul>
                        <li>Upload a ZIP file containing multiple PDF statements</li>
                        <li>File naming format: <code>UNIT-1203_2025-12.pdf</code></li>
                        <li>Format: <code>[UNIT_NUMBER]_[YEAR]-[MONTH].pdf</code></li>
                        <li>Maximum file size: 50MB per ZIP</li>
                    </ul>
                </div>
                
                <div class="upload-zone" id="upload-zone">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                        ${ICONS.upload}
                    </svg>
                    <h3>Drag & Drop ZIP File Here</h3>
                    <p>or click to browse</p>
                    <input type="file" id="file-input" accept=".zip" hidden>
                    <button class="btn btn-primary" onclick="document.getElementById('file-input').click()">
                        Select ZIP File
                    </button>
                </div>
                
                <div id="upload-progress" class="upload-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <p id="progress-text">Uploading...</p>
                </div>
                
                <div id="upload-results" class="upload-results" style="display: none;">
                    <h3>Upload Results</h3>
                    <div class="results-summary">
                        <div class="result-stat">
                            <span class="result-number" id="success-count">0</span>
                            <span class="result-label">Successful</span>
                        </div>
                        <div class="result-stat">
                            <span class="result-number" id="failed-count">0</span>
                            <span class="result-label">Failed</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderUserDashboard() {
    return `
        <div class="user-dashboard">
            <div class="welcome-banner glass-card">
                <h2>Welcome back, ${AppState.currentUser}!</h2>
                <p>Here's what's happening with your account</p>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card glass-card">
                    <div class="stat-icon" style="background: var(--primary-gradient);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">${ICONS.ticket}</svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">My Tickets</p>
                        <h3 class="stat-value">3</h3>
                    </div>
                </div>
                
                <div class="stat-card glass-card">
                    <div class="stat-icon" style="background: var(--success-gradient);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">${ICONS.calendar}</svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">Upcoming Events</p>
                        <h3 class="stat-value">2</h3>
                    </div>
                </div>
                
                <div class="stat-card glass-card">
                    <div class="stat-icon" style="background: var(--warning-gradient);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">${ICONS.file}</svg>
                    </div>
                    <div class="stat-content">
                        <p class="stat-label">New Statements</p>
                        <h3 class="stat-value">3</h3>
                    </div>
                </div>
            </div>
            
            <div class="content-grid">
                <div class="glass-card">
                    <h2 class="card-title">Announcements</h2>
                    <div class="announcements-list">
                        ${renderAnnouncement('System Maintenance', 'Scheduled maintenance on Dec 25', '2 days ago')}
                        ${renderAnnouncement('New Feature', 'Mobile app now available!', '1 week ago')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderAnnouncement(title, text, time) {
    return `
        <div class="announcement-item">
            <h4>${title}</h4>
            <p>${text}</p>
            <span class="announcement-time">${time}</span>
        </div>
    `;
}

function renderMyStatements() {
    return `
        <div class="my-statements">
            <div class="glass-card">
                <h2 class="card-title">Your Billing Statements</h2>
                <div class="statements-grid">
                    ${renderStatementCard('December 2025', '$450.00', 'Paid', '2025-12-01')}
                    ${renderStatementCard('November 2025', '$450.00', 'Paid', '2025-11-01')}
                    ${renderStatementCard('October 2025', '$450.00', 'Paid', '2025-10-01')}
                </div>
            </div>
        </div>
    `;
}

function renderStatementCard(month, amount, status, date) {
    return `
        <div class="statement-card glass-card">
            <div class="statement-header">
                <h3>${month}</h3>
                <span class="status-badge status-${status.toLowerCase()}">${status}</span>
            </div>
            <div class="statement-details">
                <p class="statement-amount">${amount}</p>
                <p class="statement-date">Due: ${date}</p>
            </div>
            <div class="statement-actions">
                <button class="btn btn-demo">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="2"/>
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    View
                </button>
                <button class="btn btn-demo">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Download
                </button>
            </div>
        </div>
    `;
}

function renderMyTickets() {
    return `
        <div class="my-tickets">
            <div class="tickets-grid">
                ${renderTicketCard('Summer Music Festival', '2025-07-15', 'TICKET-001', true)}
                ${renderTicketCard('Tech Conference 2025', '2025-08-20', 'TICKET-002', true)}
                ${renderTicketCard('Community Meetup', '2025-06-10', 'TICKET-003', false)}
            </div>
        </div>
    `;
}

function renderTicketCard(eventName, date, ticketId, showQR) {
    return `
        <div class="ticket-card glass-card">
            <div class="ticket-header">
                <h3>${eventName}</h3>
                <span class="ticket-id">${ticketId}</span>
            </div>
            <div class="ticket-details">
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Status:</strong> <span class="status-badge status-active">Active</span></p>
            </div>
            ${showQR ? `
                <div class="ticket-qr" id="qr-${ticketId}">
                    <!-- QR code will be generated here -->
                </div>
            ` : ''}
            <div class="ticket-actions">
                <button class="btn btn-primary btn-large">View Full Ticket</button>
            </div>
        </div>
    `;
}

function renderDefaultView(viewName) {
    return `
        <div class="default-view">
            <div class="glass-card">
                <h2>${viewName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
                <p>This view is under construction.</p>
            </div>
        </div>
    `;
}

// === VIEW-SPECIFIC FUNCTIONALITY ===
function initializeViewFunctionality(viewName) {
    if (viewName === 'generate-qr') {
        initQRGenerator();
    } else if (viewName === 'my-tickets') {
        generateTicketQRCodes();
    } else if (viewName === 'upload-bulk') {
        initBulkUpload();
    }
}

function initQRGenerator() {
    const form = document.getElementById('qr-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const eventId = document.getElementById('event-select').value;
            const count = parseInt(document.getElementById('ticket-count').value);
            const email = document.getElementById('attendee-email').value;

            if (!eventId) {
                alert('Please select an event');
                return;
            }

            generateQRCodes(eventId, count, email);
        });
    }
}

function generateQRCodes(eventId, count, userId = null) {
    const container = document.getElementById('qr-codes-container');
    container.innerHTML = '';

    const event = Database.events.find(e => e.id === eventId);
    if (!event) {
        container.innerHTML = '<p class="error-state">Event not found</p>';
        return;
    }

    const tickets = [];
    let successCount = 0;
    let failCount = 0;

    // Generate tickets
    for (let i = 1; i <= count; i++) {
        const result = Database.createTicket(eventId, userId);
        if (result.success) {
            tickets.push(result.ticket);
            successCount++;
        } else {
            failCount++;
            console.error(`Failed to create ticket ${i}:`, result.error);
        }
    }

    if (tickets.length === 0) {
        container.innerHTML = `<p class="error-state">Failed to generate tickets. ${failCount > 0 ? 'Event may be sold out.' : ''}</p>`;
        return;
    }

    // Display success message
    if (failCount > 0) {
        const msg = document.createElement('div');
        msg.className = 'alert alert-warning';
        msg.textContent = `Generated ${successCount} tickets. ${failCount} failed (event may be at capacity).`;
        container.appendChild(msg);
    }

    // Render QR codes
    tickets.forEach((ticket, index) => {
        const qrDiv = document.createElement('div');
        qrDiv.className = 'qr-code-item glass-card';
        qrDiv.innerHTML = `
            <h4>${event.name}</h4>
            <p class="qr-event-date">${event.date} at ${event.time}</p>
            <canvas id="qr-canvas-${ticket.ticketId}"></canvas>
            <p class="qr-id">Ticket ID: ${ticket.ticketId}</p>
            <p class="qr-token">Token: ${ticket.token.substring(0, 20)}...</p>
            <p class="qr-status">Status: <span class="status-badge status-${ticket.status}">${ticket.status}</span></p>
            <div class="qr-actions">
                <button class="btn btn-demo btn-sm" onclick="downloadQR('${ticket.ticketId}', '${event.name}')">Download</button>
                <button class="btn btn-demo btn-sm" onclick="printTicket('${ticket.ticketId}')">Print</button>
            </div>
        `;
        container.appendChild(qrDiv);

        // Generate QR code
        setTimeout(() => {
            const canvas = document.getElementById(`qr-canvas-${ticket.ticketId}`);
            if (canvas) {
                QRCode.toCanvas(canvas, ticket.qrData, {
                    width: 200,
                    margin: 2,
                    color: {
                        dark: '#667eea',
                        light: '#ffffff'
                    }
                }, (error) => {
                    if (error) console.error('QR generation error:', error);
                });
            }
        }, 100 * index);
    });

    // Show summary
    const summary = document.createElement('div');
    summary.className = 'qr-summary';
    summary.innerHTML = `
        <p><strong>Summary:</strong> Generated ${successCount} ticket(s) for ${event.name}</p>
        <p>Event capacity: ${event.ticketsSold} / ${event.capacity}</p>
    `;
    container.insertBefore(summary, container.firstChild);
}

function generateTicketQRCodes() {
    setTimeout(() => {
        const qrElements = document.querySelectorAll('[id^="qr-TICKET"]');
        qrElements.forEach(el => {
            const ticketId = el.id.replace('qr-', '');
            const canvas = document.createElement('canvas');
            el.appendChild(canvas);

            QRCode.toCanvas(canvas, ticketId, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#667eea',
                    light: '#ffffff'
                }
            });
        });
    }, 100);
}

function initBulkUpload() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');

    if (uploadZone && fileInput) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }
}

function handleFileUpload(file) {
    const progressDiv = document.getElementById('upload-progress');
    const resultsDiv = document.getElementById('upload-results');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    progressDiv.style.display = 'block';
    resultsDiv.style.display = 'none';

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressFill.style.width = progress + '%';
        progressText.textContent = `Uploading... ${progress}%`;

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                progressDiv.style.display = 'none';
                resultsDiv.style.display = 'block';
                document.getElementById('success-count').textContent = '42';
                document.getElementById('failed-count').textContent = '3';
            }, 500);
        }
    }, 200);
}

// === EVENT MANAGEMENT HELPER FUNCTIONS ===

// View event details
function viewEventDetails(eventId) {
    const stats = Database.getEventStats(eventId);
    if (!stats) {
        alert('Event not found');
        return;
    }

    const event = stats.event;
    const modal = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content glass-card" onclick="event.stopPropagation()">
                <h2>${event.name}</h2>
                <div class="event-details-full">
                    <p><strong>Date:</strong> ${event.date} at ${event.time}</p>
                    <p><strong>Venue:</strong> ${event.venue}</p>
                    <p><strong>Description:</strong> ${event.description}</p>
                    <hr>
                    <h3>Statistics</h3>
                    <p><strong>Capacity:</strong> ${stats.capacity}</p>
                    <p><strong>Tickets Sold:</strong> ${stats.totalTickets}</p>
                    <p><strong>Available:</strong> ${stats.available}</p>
                    <p><strong>Check-ins:</strong> ${stats.checkins}</p>
                    <p><strong>Unused Tickets:</strong> ${stats.unusedTickets}</p>
                </div>
                <button class="btn btn-primary" onclick="closeModal()">Close</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

// Generate tickets for a specific event
function generateEventTickets(eventId) {
    AppState.selectedEventId = eventId;
    loadView('generate-qr');

    // Pre-select the event
    setTimeout(() => {
        const select = document.getElementById('event-select');
        if (select) {
            select.value = eventId;
        }
    }, 100);
}

// Close modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Start QR scanner
function startScanner() {
    const frame = document.getElementById('scanner-frame');
    const status = document.getElementById('scanner-status');
    const button = document.getElementById('start-scan');

    if (AppState.scannerActive) {
        // Stop scanner
        AppState.scannerActive = false;
        frame.classList.remove('scanning');
        status.textContent = 'Scanner stopped';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">${ICONS.scan}</svg>
            <span>Start Scanning</span>
        `;
        return;
    }

    // Start scanner
    AppState.scannerActive = true;
    frame.classList.add('scanning');
    status.textContent = 'Scanner active - Ready to scan';
    button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 6h12v12H6z" fill="currentColor"/>
        </svg>
        <span>Stop Scanning</span>
    `;

    // Simulate scanning (in production, this would use camera API)
    status.textContent = 'Scanner active - Click "Check In" below to test with a ticket code';
}

// Scan manual QR code
function scanManualCode() {
    const input = document.getElementById('manual-qr-input');
    const qrData = input.value.trim();

    if (!qrData) {
        alert('Please enter a ticket code');
        return;
    }

    processCheckin(qrData);
    input.value = '';
}

// Process check-in
function processCheckin(qrData) {
    const result = Database.checkin(qrData);

    // Show result modal
    const statusClass = result.success ? 'success' : 'danger';
    const icon = result.success ? '✅' : '❌';

    let detailsHTML = '';
    if (result.event) {
        detailsHTML += `<p><strong>Event:</strong> ${result.event.name}</p>`;
    }
    if (result.ticket) {
        detailsHTML += `<p><strong>Ticket ID:</strong> ${result.ticket.ticketId}</p>`;
        detailsHTML += `<p><strong>Attendee:</strong> ${result.ticket.userId}</p>`;
    }
    if (result.usedAt) {
        detailsHTML += `<p><strong>Previously used at:</strong> ${new Date(result.usedAt).toLocaleString()}</p>`;
        detailsHTML += `<p><strong>Gate:</strong> ${result.usedGate}</p>`;
    }

    const modal = `
        <div class="modal-overlay checkin-result-modal ${statusClass}" onclick="closeModal()">
            <div class="modal-content glass-card" onclick="event.stopPropagation()">
                <div class="checkin-result-icon">${icon}</div>
                <h2>${result.message}</h2>
                <div class="checkin-details">
                    ${detailsHTML}
                    <p><strong>Status:</strong> <span class="status-badge status-${statusClass}">${result.status}</span></p>
                    <p><strong>Time:</strong> ${new Date(result.timestamp).toLocaleString()}</p>
                </div>
                <button class="btn btn-primary btn-large" onclick="closeModal()">Continue</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);

    // Refresh check-in list
    if (result.success) {
        setTimeout(() => {
            loadView('scan-qr');
        }, 2000);
    }
}

// Download QR code
function downloadQR(ticketId, eventName) {
    const canvas = document.getElementById(`qr-canvas-${ticketId}`);
    if (!canvas) {
        alert('QR code not found');
        return;
    }

    const link = document.createElement('a');
    link.download = `ticket-${ticketId}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

// Print ticket
function printTicket(ticketId) {
    const ticket = Database.tickets.find(t => t.ticketId === ticketId);
    if (!ticket) {
        alert('Ticket not found');
        return;
    }

    const event = Database.events.find(e => e.id === ticket.eventId);
    if (!event) {
        alert('Event not found');
        return;
    }

    // Create printable ticket
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Ticket - ${event.name}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    text-align: center;
                }
                .ticket {
                    border: 2px solid #667eea;
                    padding: 20px;
                    max-width: 400px;
                    margin: 0 auto;
                }
                h1 { color: #667eea; margin-bottom: 10px; }
                p { margin: 5px 0; }
                .qr-code { margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="ticket">
                <h1>${event.name}</h1>
                <p><strong>Date:</strong> ${event.date} at ${event.time}</p>
                <p><strong>Venue:</strong> ${event.venue}</p>
                <div class="qr-code" id="print-qr"></div>
                <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
                <p><strong>Status:</strong> ${ticket.status}</p>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
            <script>
                QRCode.toCanvas(document.createElement('canvas'), '${ticket.qrData}', {
                    width: 200,
                    margin: 2
                }, function(error, canvas) {
                    if (!error) {
                        document.getElementById('print-qr').appendChild(canvas);
                        setTimeout(() => window.print(), 500);
                    }
                });
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Get time ago string
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';

    return date.toLocaleDateString();
}

// Create event form handler
function handleCreateEvent(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const eventData = {
        id: 'evt_' + Date.now(),
        name: formData.get('name'),
        date: formData.get('date'),
        time: formData.get('time'),
        venue: formData.get('venue'),
        capacity: parseInt(formData.get('capacity')),
        description: formData.get('description'),
        status: 'upcoming',
        ticketsSold: 0,
        createdAt: new Date().toISOString()
    };

    Database.events.push(eventData);

    alert(`Event "${eventData.name}" created successfully!`);
    loadView('events-dashboard');
}

// Initialize create event form
function initCreateEventForm() {
    const form = document.getElementById('event-form');
    if (form) {
        form.addEventListener('submit', handleCreateEvent);
    }
}

// Add to initializeViewFunctionality
const originalInitializeViewFunctionality = initializeViewFunctionality;
function initializeViewFunctionality(viewName) {
    originalInitializeViewFunctionality(viewName);

    if (viewName === 'create-event') {
        initCreateEventForm();
    }
}
