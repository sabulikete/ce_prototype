import React from 'react';
import { Ticket, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

interface TicketStatsProps {
  ticketStats: {
    total: number;
    byStatus: {
      issued: number;
      checkedIn: number;
      voided: number;
    };
  };
}

const TicketStats: React.FC<TicketStatsProps> = ({ ticketStats }) => {
  const { total, byStatus } = ticketStats;

  return (
    <div className="ticket-stats">
      <div className="metric-card">
        <div className="metric-icon">
          <BarChart3 size={24} />
        </div>
        <div className="metric-content">
          <h3>Total Tickets</h3>
          <p className="metric-value">{total}</p>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon">
          <Ticket size={24} />
        </div>
        <div className="metric-content">
          <h3>Issued</h3>
          <p className="metric-value">{byStatus.issued}</p>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon">
          <CheckCircle size={24} />
        </div>
        <div className="metric-content">
          <h3>Checked In</h3>
          <p className="metric-value">{byStatus.checkedIn}</p>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon">
          <XCircle size={24} />
        </div>
        <div className="metric-content">
          <h3>Voided</h3>
          <p className="metric-value">{byStatus.voided}</p>
        </div>
      </div>
    </div>
  );
};

export default TicketStats;
