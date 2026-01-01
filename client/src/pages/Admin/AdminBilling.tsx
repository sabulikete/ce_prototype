import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, X, Download } from 'lucide-react';
import { fetchAllStatements, uploadBilling, downloadStatement } from '../../services/api';
import './AdminBilling.css';

interface BillingStatement {
  id: number;
  period: string;
  file_path: string;
  user: {
    id: number;
    name: string;
    email: string;
    unit_id: string;
  };
}

const AdminBilling: React.FC = () => {
  const [statements, setStatements] = useState<BillingStatement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const loadStatements = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAllStatements();
      setStatements(data);
    } catch (error) {
      console.error('Failed to load statements', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatements();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadResult(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadBilling(file);
      setUploadResult({ success: true, message: result.message || 'Upload successful', details: result });
      setFile(null);
      loadStatements();
    } catch (error: any) {
      console.error('Upload failed', error);
      setUploadResult({ success: false, message: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: number, filename: string) => {
    try {
      await downloadStatement(id, filename);
    } catch (error) {
      console.error('Download failed', error);
      alert('Failed to download statement');
    }
  };

  return (
    <div className="admin-billing-container">
      <div className="admin-header">
        <h1>Billing Management</h1>
      </div>

      <div className="billing-layout">
        <div className="upload-section">
          <h3>Upload Statements</h3>
          <div 
            className={`drop-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              id="file-upload" 
              onChange={handleChange} 
              accept=".pdf,.zip"
              style={{ display: 'none' }} 
            />
            
            {!file ? (
              <label htmlFor="file-upload" className="upload-label">
                <UploadCloud size={48} />
                <p>Drag & drop PDF or ZIP file here</p>
                <span>or click to browse</span>
              </label>
            ) : (
              <div className="file-preview">
                <FileText size={32} />
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
                <button className="icon-btn" onClick={() => setFile(null)}>
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {file && !uploading && !uploadResult && (
            <button className="btn-primary full-width" onClick={handleUpload}>
              Upload File
            </button>
          )}

          {uploading && (
            <div className="upload-status">
              <div className="spinner"></div>
              <p>Uploading and processing...</p>
            </div>
          )}

          {uploadResult && (
            <div className={`upload-result ${uploadResult.success ? 'success' : 'error'}`}>
              {uploadResult.success ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              <div>
                <h4>{uploadResult.success ? 'Success' : 'Error'}</h4>
                <p>{uploadResult.message}</p>
                {uploadResult.details && uploadResult.details.results && (
                  <div className="upload-details">
                    <p>Processed: {uploadResult.details.results.length}</p>
                    <p>Failures: {uploadResult.details.failures.length}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="statements-list-section">
          <h3>Recent Statements</h3>
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="statements-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Unit</th>
                    <th>User</th>
                    <th>File</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {statements.map(stmt => (
                    <tr key={stmt.id}>
                      <td>{new Date(stmt.period).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</td>
                      <td>{stmt.user.unit_id || '-'}</td>
                      <td>
                        <div className="user-info-sm">
                          <span>{stmt.user.name}</span>
                          <span className="text-muted">{stmt.user.email}</span>
                        </div>
                      </td>
                      <td className="mono-sm">{stmt.file_path}</td>
                      <td>
                        <button 
                          className="icon-btn" 
                          onClick={() => handleDownload(stmt.id, stmt.file_path)}
                          title="Download"
                        >
                          <Download size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {statements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center">No statements found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBilling;