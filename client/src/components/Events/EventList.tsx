import React from 'react';
import { Calendar, MapPin } from 'lucide-react';

interface EventData {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  ticketStats: {
    issued: number;
    checkedIn: number;
  };
}

interface EventListProps {
  events: EventData[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  const now = new Date();
  
  return (
    <div className="event-list">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Location</th>
            <th>Status</th>
            <th>Tickets</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id}>
              <td>{event.title}</td>
              <td>
                <div className="date-cell">
                  <Calendar size={14} />
                  <span>{new Date(event.startDate).toLocaleDateString()}</span>
                </div>
              </td>
              <td>
                <div className="location-cell">
                  <MapPin size={14} />
                  <span>{event.location}</span>
                </div>
              </td>
              <td>
                <span className={`status-badge ${event.status.toLowerCase()}`}>
                  {event.status}
                </span>
              </td>
              <td>
                {/* Smart Display: Show "X issued" for upcoming, "X/Y checked in" for past */}
                {new Date(event.startDate) > now ? (
                  <span className="ticket-count">{event.ticketStats.issued} issued</span>
                ) : (
                  <span className="ticket-count">
                    {event.ticketStats.checkedIn}/{event.ticketStats.issued} checked in
                  </span>
                )}
              </td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center">No events found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EventList;
