import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Calendar, Plus, ScanLine, Ticket, X } from 'lucide-react';
import './AdminEvents.css';

const AdminEvents = () => {
    const [activeTab, setActiveTab] = useState('events'); // events, scanner
    const [events, setEvents] = useState([
        { id: 1, title: 'New Year Party', date: '2024-12-31', location: 'Clubhouse', tickets: 150 }
    ]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [scanResult, setScanResult] = useState(null);

    // Mock Scanner Input
    const [scanInput, setScanInput] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        // Logic to add event
        const newEvent = {
            id: events.length + 1,
            title: e.target.title.value,
            date: e.target.date.value,
            location: e.target.location.value,
            tickets: 0
        };
        setEvents([...events, newEvent]);
        setShowCreateModal(false);
    };

    const generateTicket = (event) => {
        // Generate a mock token
        const token = `TICKET:${event.id}:${Math.random().toString(36).substr(2, 9)}`;
        setSelectedEvent({ ...event, token });
    };

    const handleSimulatedScan = () => {
        // Check if input matches valid format
        if (scanInput.startsWith('TICKET:')) {
            const parts = scanInput.split(':');
            const evtId = parts[1];
            const evt = events.find(e => e.id == evtId);
            if (evt) {
                setScanResult({ success: true, msg: 'Valid Ticket', eventName: evt.title });
            } else {
                setScanResult({ success: false, msg: 'Event not found' });
            }
        } else {
            setScanResult({ success: false, msg: 'Invalid QR Format' });
        }
        setScanInput('');
    };

    return (
        <div className="admin-events fade-in">
            <header className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Event Manager</h1>
                    <p className="text-muted">Manage events, generate tickets, and scan attendees</p>
                </div>
                <div className="tab-switcher glass-panel">
                    <button
                        className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                        onClick={() => setActiveTab('events')}
                    >
                        Events
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
                        onClick={() => setActiveTab('scanner')}
                    >
                        Scanner
                    </button>
                </div>
            </header>

            {activeTab === 'events' && (
                <div className="events-view">
                    <div className="flex-row justify-between mb-4">
                        <h2 className="text-xl font-semibold">Upcoming Events</h2>
                        <button className="btn-primary flex-center gap-2" onClick={() => setShowCreateModal(true)}>
                            <Plus size={18} /> Create Event
                        </button>
                    </div>

                    <div className="events-grid">
                        {events.map(evt => (
                            <div key={evt.id} className="card glass-panel event-card">
                                <div className="event-date">
                                    <span className="month">{new Date(evt.date).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="day">{new Date(evt.date).getDate()}</span>
                                </div>
                                <div className="event-details">
                                    <h3>{evt.title}</h3>
                                    <p className="text-muted flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                                        <Calendar size={14} /> {evt.location}
                                    </p>
                                </div>
                                <div className="event-actions">
                                    <button className="btn-ghost" onClick={() => generateTicket(evt)}>
                                        <Ticket size={16} /> Generate Ticket
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'scanner' && (
                <div className="scanner-view flex-center flex-col">
                    <div className="scanner-frame glass-panel">
                        <ScanLine size={48} className="scanner-icon" />
                        <h3>Simulate QR Scan</h3>
                        <p className="text-muted mb-4">Enter ticket token manually for demo</p>

                        <div className="flex-row gap-2 w-full">
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Paste TICKET:... string"
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                            />
                            <button className="btn-primary" onClick={handleSimulatedScan}>Scan</button>
                        </div>

                        {scanResult && (
                            <div className={`scan-result glass-panel ${scanResult.success ? 'success' : 'error'}`}>
                                {scanResult.success ? (
                                    <>
                                        <h1 className="text-4xl mb-2">✅</h1>
                                        <h2>Access Granted</h2>
                                        <p>{scanResult.eventName}</p>
                                    </>
                                ) : (
                                    <>
                                        <h1 className="text-4xl mb-2">❌</h1>
                                        <h2>Access Denied</h2>
                                        <p>{scanResult.msg}</p>
                                    </>
                                )}
                                <button className="btn-ghost mt-4" onClick={() => setScanResult(null)}>Scan Next</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Ticket Modal */}
            {selectedEvent && (
                <div className="modal-overlay flex-center">
                    <div className="modal glass-panel">
                        <button className="close-btn" onClick={() => setSelectedEvent(null)}><X size={20} /></button>
                        <h2 className="text-center mb-4">{selectedEvent.title}</h2>
                        <div className="qr-container flex-center">
                            <QRCodeCanvas value={selectedEvent.token} size={200} />
                        </div>
                        <p className="text-center mt-4 text-sm font-mono break-all text-muted">
                            {selectedEvent.token}
                        </p>
                        <p className="text-center mt-2 text-primary font-bold">VIP ADMISSION</p>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay flex-center">
                    <div className="modal glass-panel">
                        <h2 className="mb-4">Create New Event</h2>
                        <form onSubmit={handleCreate} className="flex-col gap-4">
                            <input name="title" className="input-field" placeholder="Event Title" required />
                            <input name="date" type="date" className="input-field" required />
                            <input name="location" className="input-field" placeholder="Location" required />
                            <div className="flex-row gap-2 mt-4">
                                <button type="button" className="btn-ghost flex-1" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEvents;
