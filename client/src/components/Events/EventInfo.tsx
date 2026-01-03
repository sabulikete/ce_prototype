import React from 'react';
import { Calendar, MapPin, FileText } from 'lucide-react';

interface EventInfoProps {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description?: string;
  status: string;
  publishedAt?: string | null;
}

const EventInfo: React.FC<EventInfoProps> = ({
  title,
  startDate,
  endDate,
  location,
  description,
  status
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PUBLISHED':
        return 'status-badge status-published';
      case 'DRAFT':
        return 'status-badge status-draft';
      case 'ARCHIVED':
        return 'status-badge status-archived';
      default:
        return 'status-badge';
    }
  };

  return (
    <div className="event-info-card">
      <div className="event-info-header">
        <h1>{title}</h1>
        <span className={getStatusClass(status)}>{status}</span>
      </div>
      
      <div className="event-info-details">
        <div className="info-item">
          <Calendar size={18} />
          <div>
            <strong>Start:</strong> {formatDate(startDate)}
          </div>
        </div>
        
        <div className="info-item">
          <Calendar size={18} />
          <div>
            <strong>End:</strong> {formatDate(endDate)}
          </div>
        </div>
        
        <div className="info-item">
          <MapPin size={18} />
          <div>
            <strong>Location:</strong> {location || 'Not specified'}
          </div>
        </div>
      </div>
      
      {description && (
        <div className="event-description">
          <FileText size={18} />
          <div>
            <strong>Description:</strong>
            <p>{description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventInfo;
