import React, { useState, useEffect, useRef } from 'react';
import { ScanLine, CheckCircle, XCircle, Camera, Search } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { fetchContent, checkInTicket } from '../services/api';
import './Scanner.css';

const Scanner: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [scanInput, setScanInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const selectedEventIdRef = useRef(selectedEventId);

  useEffect(() => {
    selectedEventIdRef.current = selectedEventId;
  }, [selectedEventId]);

  useEffect(() => {
    loadEvents();
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    if (cameraActive) {
      // Small timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        if (!scannerRef.current) {
          const scanner = new Html5QrcodeScanner(
            "reader",
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            /* verbose= */ false
          );
          
          scanner.render(onScanSuccess, onScanFailure);
          scannerRef.current = scanner;
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }
  }, [cameraActive]);

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    if (scanning) return;
    
    // Prevent multiple scans of the same code in rapid succession if needed
    // For now, we just process it.
    
    handleTicketCheckIn(decodedText);
  };

  const onScanFailure = (error: any) => {
    // console.warn(`Code scan error = ${error}`);
  };

  const handleTicketCheckIn = async (token: string) => {
    if (!selectedEventIdRef.current) return;
    
    setScanning(true);
    setScanResult(null);

    try {
      const result = await checkInTicket(token, parseInt(selectedEventIdRef.current));
      setScanResult({ success: true, memberName: result.memberName });
      
      // If using camera, we might want to pause or show success briefly
      if (cameraActive && scannerRef.current) {
         scannerRef.current.pause();
         setTimeout(() => {
             if (scannerRef.current) scannerRef.current.resume();
         }, 2000);
      }
      
    } catch (error: any) {
      setScanResult({ success: false, message: error.message });
    } finally {
      setScanning(false);
    }
  };

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
    handleTicketCheckIn(scanInput);
    setScanInput('');
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
    setScanResult(null);
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
              <div id="reader" style={{ width: '100%' }}></div>
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