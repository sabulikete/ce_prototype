import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Ticket } from 'lucide-react';
import { getEventDetail } from '../../services/api';
import EventInfo from '../../components/Events/EventInfo';
import TicketStats from '../../components/Events/TicketStats';
import AttendeeTable from '../../components/Events/AttendeeTable';
import IssueTicketsModal from '../../components/Events/IssueTicketsModal';

interface EventDetailData {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  publishedAt?: string | null;
  ticketStats: {
    total: number;
    byStatus: {
      issued: number;
      checkedIn: number;
      voided: number;
    };
  };
}

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIssueModal, setShowIssueModal] = useState(false);

  useEffect(() => {
    loadEventDetail();
  }, [id]);

  const loadEventDetail = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getEventDetail(parseInt(id));
      setEvent(data);
    } catch (err: unknown) {
      // Handle both Error objects from api.ts and unexpected error types
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load event details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Read returnTo from location state or fallback to default
    const returnTo = (location.state as any)?.returnTo || '/admin/events';
    navigate(returnTo);
  };

  if (loading) {
    return (
      <div className="event-detail-container">
        <div className="event-detail-header">
          <div className="skeleton skeleton-button" style={{ width: '140px', height: '36px' }}></div>
          <div className="skeleton skeleton-button" style={{ width: '140px', height: '36px' }}></div>
        </div>

        {/* Event Info Skeleton */}
        <div className="event-info-skeleton">
          <div className="skeleton skeleton-title" style={{ width: '60%', height: '32px', marginBottom: '16px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '40%', height: '20px', marginBottom: '8px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '30%', height: '20px', marginBottom: '8px' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '100%', height: '60px', marginTop: '16px' }}></div>
        </div>

        {/* Ticket Stats Skeleton */}
        <div className="ticket-stats-skeleton" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', margin: '24px 0' }}>
          <div className="skeleton skeleton-card" style={{ height: '100px', borderRadius: '8px' }}></div>
          <div className="skeleton skeleton-card" style={{ height: '100px', borderRadius: '8px' }}></div>
          <div className="skeleton skeleton-card" style={{ height: '100px', borderRadius: '8px' }}></div>
          <div className="skeleton skeleton-card" style={{ height: '100px', borderRadius: '8px' }}></div>
        </div>

        {/* Attendee Table Skeleton */}
        <div className="attendee-table-skeleton">
          <div className="skeleton skeleton-text" style={{ width: '150px', height: '24px', marginBottom: '16px' }}></div>
          <div className="skeleton skeleton-card" style={{ height: '300px', borderRadius: '8px' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    const isNotFound = error.includes('not found');
    const isAccessDenied = error.includes('Access denied');
    
    return (
      <div className="event-detail-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>{isNotFound ? 'Event Not Found' : isAccessDenied ? 'Access Denied' : 'Error Loading Event'}</h2>
          <p>{error}</p>
          <div className="error-actions">
            {!isAccessDenied && !isNotFound && (
              <button onClick={loadEventDetail} className="retry-btn">
                Retry
              </button>
            )}
            <button onClick={handleBack} className="back-btn">
              Back to Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="event-detail-container">
      <div className="event-detail-header">
        <button onClick={handleBack} className="back-button">
          <ArrowLeft size={20} />
          Back to Events
        </button>
        <button 
          onClick={() => setShowIssueModal(true)} 
          className="btn-primary issue-tickets-btn"
        >
          <Ticket size={18} />
          Issue Tickets
        </button>
      </div>

      <EventInfo
        title={event.title}
        startDate={event.startDate}
        endDate={event.endDate}
        location={event.location}
        description={event.description}
        status={event.status}
        publishedAt={event.publishedAt}
      />

      <TicketStats ticketStats={event.ticketStats} />

      <AttendeeTable eventId={event.id} />

      <IssueTicketsModal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        eventId={event.id}
      />
    </div>
  );
};

export default EventDetail;

