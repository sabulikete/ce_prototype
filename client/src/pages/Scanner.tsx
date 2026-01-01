import React, { useState, useEffect } from 'react';
import { ScanLine, CheckCircle, XCircle, Camera, Search } from 'lucide-react';
import { fetchContent, checkInTicket } from '../services/api';
import './Scanner.css';

const Scanner: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await fetchContent('EVENT');
      // Filter for active events (today or future)
      setEvents(data);
      if (data.length > 0) {
        setSelectedEventId(data[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load events', error);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !scanInput) return;

    setScanning(true);
    setScanResult(null);

    try {
      const result = await checkInTicket(scanInput, parseInt(selectedEventId));
      setScanResult({ success: true, memberName: result.memberName });
      setScanInput(''); // Clear input on success
    } catch (error: any) {
      setScanResult({ success: false, message: error.message });
    } finally {
      setScanning(false);
    }
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
    // In a real app, this would initialize the QR scanner library
  };

  return (
    <div className="scanner-container">
      <div className="scanner-header">
        <h1>Ticket Scanner</h1>
      </div>

      <div className="scanner-content">
        <div className="event-selector">
          <label>Select Event</label>
          <select 
            value={selectedEventId} 
            onChange={(e) => setSelectedEventId(e.target.value)}
            disabled={events.length === 0}
          >
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.title} ({new Date(event.event.start_at).toLocaleDateString()})
              </option>
            ))}
            {events.length === 0 && <option>No events found</option>}
          </select>
        </div>

        <div className="scan-area">
          {cameraActive ? (
            <div className="camera-view">
              <div className="camera-placeholder">
                <Camera size={48} />
                <p>Camera Active (Simulation)</p>
                <button className="btn-secondary" onClick={() => setScanInput('TICKET:1:DEMO')}>
                  Simulate Scan
                </button>
              </div>
            </div>
          ) : (
            <div className="manual-input">
              <form onSubmit={handleScan}>
                <div className="input-group">
                  <input 
                    type="text" 
                    placeholder="Scan or enter ticket token..." 
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn-primary" disabled={!scanInput || scanning}>
                    {scanning ? 'Checking...' : 'Check In'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <button className="btn-text" onClick={toggleCamera}>
            {cameraActive ? 'Switch to Manual Entry' : 'Switch to Camera'}
          </button>
        </div>

        {scanResult && (
          <div className={`scan-result ${scanResult.success ? 'success' : 'error'}`}>
            {scanResult.success ? (
              <>
                <CheckCircle size={64} />
                <h2>Access Granted</h2>
                <p className="member-name">{scanResult.memberName}</p>
                <p className="timestamp">{new Date().toLocaleTimeString()}</p>
              </>
            ) : (
              <>
                <XCircle size={64} />
                <h2>Access Denied</h2>
                <p className="error-msg">{scanResult.message}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;