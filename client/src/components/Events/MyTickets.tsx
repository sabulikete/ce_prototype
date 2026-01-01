import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { fetchMyTickets } from '../../services/api';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import './MyTickets.css';

interface Ticket {
  id: number;
  token: string;
  event: {
    content: {
      title: string;
    };
    start_at: string;
    location: string;
  };
  checked_in_at: string | null;
  voided_at: string | null;
}

const MyTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const downloadQR = (ticketId: number, eventTitle: string) => {
    const canvas = document.getElementById(`qr-${ticketId}`) as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `ticket-${eventTitle.replace(/\s+/g, '-').toLowerCase()}-${ticketId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  useEffect(() => {
    const loadTickets = async () => {
      setLoading(true);
      try {
        const data = await fetchMyTickets();
        setTickets(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  if (loading) return <p>Loading tickets...</p>;

  return (
    <div className="my-tickets">
      <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
      <h1>My Tickets</h1>
      <div className="tickets-list">
        {tickets.length === 0 ? (
          <p>No tickets found.</p>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-info">
                <h3>{ticket.event.content.title}</h3>
                <p><strong>Date:</strong> {new Date(ticket.event.start_at).toLocaleString()}</p>
                <p><strong>Location:</strong> {ticket.event.location}</p>
                {ticket.checked_in_at && <span className="badge checked-in">Checked In</span>}
                {ticket.voided_at && <span className="badge voided">Voided</span>}
              </div>
              <div className="ticket-qr">
                {!ticket.voided_at && (
                  <div className="qr-container">
                    <QRCodeCanvas 
                      id={`qr-${ticket.id}`} 
                      value={ticket.token} 
                      size={128} 
                      level={"H"}
                      includeMargin={true}
                    />
                    <button 
                      className="download-btn"
                      onClick={() => downloadQR(ticket.id, ticket.event.content.title)}
                      title="Download Ticket QR"
                    >
                      <Download size={16} /> Download
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyTickets;
