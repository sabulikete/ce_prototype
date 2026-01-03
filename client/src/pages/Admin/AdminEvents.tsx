import React, { useState, useEffect } from 'react';
import { Calendar, Ticket, MapPin, CheckCircle, XCircle, BarChart3, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchContent, fetchEventAttendees, issueTickets, fetchUsers, getDashboardMetrics, getDashboardEvents } from '../../services/api';
import EventMetrics from '../../components/Events/EventMetrics';
import EventList from '../../components/Events/EventList';
import './AdminEvents.css';

interface Event {
  id: number;
  title: string;
  event: {
    start_at: string;
    end_at: string;
    location: string;
  };
}

interface TicketData {
  id: number;
  code_hash: string;
  checked_in_at: string | null;
  voided_at: string | null;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface UserData {
  id: number;
  name: string;
  email: string;
}

const AdminEvents: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets'>('dashboard');
  
  // Dashboard state
  const [metrics, setMetrics] = useState({ totalUpcoming: 0, totalTicketsIssued: 0, avgCheckInRate: 0 });
  const [dashboardEvents, setDashboardEvents] = useState<any[]>([]);
  const [dashboardPagination, setDashboardPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [filterStatus, setFilterStatus] = useState<'upcoming' | 'past'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  
  // Ticket management state
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<TicketData[]>([]);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [issuing, setIssuing] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load dashboard data
  const loadDashboard = async () => {
    try {
      setIsDashboardLoading(true);
      setDashboardError(null);
      const [metricsData, eventsData] = await Promise.all([
        getDashboardMetrics(),
        getDashboardEvents({
          page: dashboardPagination.page,
          limit: dashboardPagination.limit,
          status: filterStatus,
          search: debouncedSearch
        })
      ]);
      
      setMetrics(metricsData);
      setDashboardEvents(eventsData.data);
      setDashboardPagination(eventsData.meta);
    } catch (error) {
      console.error('Failed to load dashboard', error);
      setDashboardError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard();
    }
  }, [activeTab, dashboardPagination.page, filterStatus, debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    setDashboardPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setDashboardPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on search
  };

  const handleFilterChange = (newStatus: 'upcoming' | 'past') => {
    setFilterStatus(newStatus);
    setDashboardPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter
  };

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await fetchContent('EVENT');
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleEventClick = async (event: Event) => {
    setSelectedEvent(event);
    try {
      const data = await fetchEventAttendees(event.id);
      setAttendees(data);
    } catch (error) {
      console.error('Failed to load attendees', error);
    }
  };

  const handleOpenIssueModal = async () => {
    setShowIssueModal(true);
    try {
      const data = await fetchUsers();
      // Filter out users who already have a ticket
      const attendeeIds = new Set(attendees.map(t => t.user.id));
      setUsers(data.filter((u: any) => !attendeeIds.has(u.id) && u.status === 'ACTIVE'));
    } catch (error) {
      console.error('Failed to load users', error);
    }
  };

  const handleUserSelect = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleIssueTickets = async () => {
    if (!selectedEvent || selectedUserIds.length === 0) return;
    setIssuing(true);
    try {
      await issueTickets(selectedEvent.id, selectedUserIds);
      // Refresh attendees
      const data = await fetchEventAttendees(selectedEvent.id);
      setAttendees(data);
      setShowIssueModal(false);
      setSelectedUserIds([]);
    } catch (error) {
      console.error('Failed to issue tickets', error);
      alert('Failed to issue tickets');
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="admin-events-container">
      <div className="admin-header">
        <h1>Event Management</h1>
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={18} /> Dashboard
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <Ticket size={18} /> Ticket Management
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="dashboard-view">
          {/* Metrics Section */}
          <EventMetrics 
            totalUpcoming={metrics.totalUpcoming}
            totalTicketsIssued={metrics.totalTicketsIssued}
            avgCheckInRate={metrics.avgCheckInRate}
          />

          {/* Search and Filter Controls */}
          <div className="dashboard-controls">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search events by title..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filterStatus === 'upcoming' ? 'active' : ''}`}
                onClick={() => handleFilterChange('upcoming')}
              >
                Upcoming
              </button>
              <button 
                className={`filter-btn ${filterStatus === 'past' ? 'active' : ''}`}
                onClick={() => handleFilterChange('past')}
              >
                Past
              </button>
            </div>
          </div>

          {/* Event List */}
          {dashboardError ? (
            <div className="error-state">
              <XCircle size={48} />
              <p>{dashboardError}</p>
              <button className="btn-primary" onClick={loadDashboard}>
                Retry
              </button>
            </div>
          ) : isDashboardLoading ? (
            <div className="loading">Loading events...</div>
          ) : dashboardEvents.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <p>{searchQuery ? 'No results found' : `No ${filterStatus} events`}</p>
            </div>
          ) : (
            <>
              <EventList events={dashboardEvents} />
              
              {/* Pagination Controls */}
              {dashboardPagination.totalPages > 1 && (
                <div className="pagination-controls">
                  <button
                    onClick={() => handlePageChange(dashboardPagination.page - 1)}
                    disabled={dashboardPagination.page === 1}
                    className="pagination-btn"
                  >
                    <ChevronLeft size={18} /> Previous
                  </button>
                  <span className="pagination-info">
                    Page {dashboardPagination.page} of {dashboardPagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(dashboardPagination.page + 1)}
                    disabled={dashboardPagination.page === dashboardPagination.totalPages}
                    className="pagination-btn"
                  >
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="events-layout">
        <div className="events-sidebar">
          <h3>Upcoming Events</h3>
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="events-list-sidebar">
              {events.map(event => (
                <div 
                  key={event.id} 
                  className={`event-card ${selectedEvent?.id === event.id ? 'active' : ''}`}
                  onClick={() => handleEventClick(event)}
                >
                  <div className="event-card-header">
                    <span className="event-title">{event.title}</span>
                  </div>
                  <div className="event-details">
                    <div className="detail-item">
                      <Calendar size={14} />
                      <span>{new Date(event.event.start_at).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <MapPin size={14} />
                      <span>{event.event.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="event-main">
          {selectedEvent ? (
            <>
              <div className="event-main-header">
                <div>
                  <h2>{selectedEvent.title}</h2>
                  <div className="event-meta">
                    <span><Calendar size={16} /> {new Date(selectedEvent.event.start_at).toLocaleString()}</span>
                    <span><MapPin size={16} /> {selectedEvent.event.location}</span>
                  </div>
                </div>
                <button className="btn-primary" onClick={handleOpenIssueModal}>
                  <Ticket size={18} /> Issue Tickets
                </button>
              </div>

              <div className="attendees-section">
                <h3>Attendees ({attendees.length})</h3>
                <div className="attendees-list">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Ticket ID</th>
                        <th>Status</th>
                        <th>Checked In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map(ticket => {
                        const status = ticket.voided_at ? 'VOID' : ticket.checked_in_at ? 'CHECKED_IN' : 'ISSUED';
                        return (
                        <tr key={ticket.id}>
                          <td>
                            <div className="user-info">
                              <span className="user-name">{ticket.user.name}</span>
                              <span className="user-email">{ticket.user.email}</span>
                            </div>
                          </td>
                          <td className="mono">{ticket.code_hash ? ticket.code_hash.substring(0, 8) : 'N/A'}...</td>
                          <td>
                            <span className={`status-badge ${status.toLowerCase()}`}>
                              {status}
                            </span>
                          </td>
                          <td>
                            {ticket.checked_in_at ? (
                              <span className="check-in-time">
                                <CheckCircle size={14} color="#34d399" />
                                {new Date(ticket.checked_in_at).toLocaleTimeString()}
                              </span>
                            ) : (
                              <span className="not-checked-in">-</span>
                            )}
                          </td>
                        </tr>
                      )})}
                      {attendees.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center">No attendees yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Calendar size={48} />
              <p>Select an event to manage attendees</p>
            </div>
          )}
        </div>
      </div>
      )}
      
      {showIssueModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Issue Tickets</h2>
            <p>Select users to issue tickets for <strong>{selectedEvent?.title}</strong></p>
            
            <div className="user-selection-list">
              {users.map(user => (
                <div 
                  key={user.id} 
                  className={`user-select-item ${selectedUserIds.includes(user.id) ? 'selected' : ''}`}
                  onClick={() => handleUserSelect(user.id)}
                >
                  <div className="user-info">
                    <span className="user-name">{user.name}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  {selectedUserIds.includes(user.id) && <CheckCircle size={20} color="#34d399" />}
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowIssueModal(false)}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleIssueTickets}
                disabled={selectedUserIds.length === 0 || issuing}
              >
                {issuing ? 'Issuing...' : `Issue ${selectedUserIds.length} Tickets`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;