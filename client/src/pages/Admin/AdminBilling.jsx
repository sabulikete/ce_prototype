import { useState } from 'react';
import { UploadCloud, FileArchive, CheckCircle, AlertTriangle, X } from 'lucide-react';
import './AdminBilling.css';

const AdminBilling = () => {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [jobId, setJobId] = useState(null);
    const [logs, setLogs] = useState([]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (f) => {
        // In real app, check for ZIP
        setFile(f);
        setJobId(null);
        setLogs([]);
    };

    const simulateUpload = () => {
        if (!file) return;
        setUploading(true);

        // Simulate Job Creation
        setTimeout(() => {
            const newJobId = 'JOB-' + Math.floor(Math.random() * 10000);
            setJobId(newJobId);
            addLog('Job created: ' + newJobId);
            addLog('Uploading ' + file.name + '...');

            // Simulate Processing steps
            setTimeout(() => {
                addLog('Verifying ZIP integrity...');
                setTimeout(() => {
                    addLog('Extracting files...');

                    processMockFiles();

                }, 1000);
            }, 1000);
        }, 1000);
    };

    const processMockFiles = () => {
        const mockFiles = [
            'DEC-2025 3C-201.pdf',
            'DEC-2025 3C-202.pdf',
            'DEC-2025 3C-203.pdf',
            'invalid_name.pdf'
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i >= mockFiles.length) {
                clearInterval(interval);
                addLog('Job Completed. Success: 3, Failed: 1');
                setUploading(false);
                return;
            }

            const fname = mockFiles[i];
            if (fname.includes('invalid')) {
                addLog(`❌ Failed: ${fname} (INVALID_FILENAME_FORMAT)`, 'error');
            } else {
                addLog(`✅ Processed: ${fname}`, 'success');
            }
            i++;
        }, 800);
    };

    const addLog = (msg, type = 'info') => {
        setLogs(prev => [...prev, { msg, type, time: new Date() }]);
    };

    return (
        <div className="admin-billing fade-in">
            <header className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Billing Management</h1>
                    <p className="text-muted">Upload bulk statements via ZIP archive</p>
                </div>
            </header>

            <div className="layout-grid">
                <div className="upload-section">
                    <div
                        className={`drop-zone glass-panel ${dragActive ? 'active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden-input"
                            accept=".zip,.pdf"
                            onChange={handleChange}
                        />

                        {!file ? (
                            <label htmlFor="file-upload" className="upload-label">
                                <UploadCloud size={48} className="upload-icon" />
                                <p className="primary-text">Drag & Drop ZIP file here</p>
                                <p className="secondary-text">or click to browse</p>
                                <p className="hint-text">Supported: .zip (Max 500MB)</p>
                            </label>
                        ) : (
                            <div className="file-preview">
                                <FileArchive size={32} className="text-primary" />
                                <div>
                                    <p className="file-name">{file.name}</p>
                                    <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="remove-btn"
                                    disabled={uploading}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="requirements-card glass-panel mt-4">
                        <h3><AlertTriangle size={18} /> Filename Requirements</h3>
                        <p>Ensure PDF files inside the ZIP follow this format:</p>
                        <code>MMM-YYYY B C-U.pdf</code>
                        <p className="example">Example: DEC-2025 3C-201.pdf</p>
                    </div>

                    <button
                        className="btn-primary w-full mt-4"
                        disabled={!file || uploading}
                        onClick={simulateUpload}
                    >
                        {uploading ? 'Processing...' : 'Start Upload Job'}
                    </button>
                </div>

                <div className="console-section glass-panel">
                    <div className="console-header">
                        <h3>Job Console {jobId && <span className="job-id">#{jobId}</span>}</h3>
                        {uploading && <div className="spinner"></div>}
                    </div>
                    <div className="console-output">
                        {logs.length === 0 ? (
                            <p className="placeholder-text">Waiting for job to start...</p>
                        ) : (
                            logs.map((log, idx) => (
                                <div key={idx} className={`log-line ${log.type}`}>
                                    <span className="log-time">{log.time.toLocaleTimeString()}</span>
                                    <span className="log-msg">{log.msg}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBilling;
