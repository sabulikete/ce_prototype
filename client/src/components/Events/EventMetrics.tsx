import React from 'react';

interface MetricsProps {
  totalUpcoming: number;
  totalTicketsIssued: number;
  avgCheckInRate: number;
}

const EventMetrics: React.FC<MetricsProps> = ({ totalUpcoming, totalTicketsIssued, avgCheckInRate }) => {
  return (
    <div className="event-metrics">
      <div className="metric-card">
        <h3>Upcoming Events</h3>
        <p className="metric-value">{totalUpcoming}</p>
      </div>
      <div className="metric-card">
        <h3>Total Tickets Issued</h3>
        <p className="metric-value">{totalTicketsIssued}</p>
      </div>
      <div className="metric-card">
        <h3>Avg Check-in Rate</h3>
        <p className="metric-value">{avgCheckInRate.toFixed(1)}%</p>
      </div>
    </div>
  );
};

export default EventMetrics;
