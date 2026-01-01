import React, { useEffect, useState } from 'react';
import { fetchMyStatements, downloadStatement } from '../services/api';
import { Link } from 'react-router-dom';
import { Download, FileText, ArrowLeft } from 'lucide-react';
import './Billing.css';

interface Statement {
  id: number;
  period: string;
  created_at: string;
}

const Billing: React.FC = () => {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStatements = async () => {
      setLoading(true);
      try {
        const data = await fetchMyStatements();
        setStatements(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadStatements();
  }, []);

  const handleDownload = async (id: number, period: string) => {
    try {
      const filename = `Statement-${new Date(period).toISOString().slice(0, 7)}.pdf`;
      await downloadStatement(id, filename);
    } catch (error) {
      console.error(error);
      alert('Failed to download statement');
    }
  };

  return (
    <div className="billing-page fade-in">
      <div className="billing-container">
        <div className="billing-header">
            <Link to="/dashboard" className="back-btn glass-panel mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg">
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl font-bold mb-2">My Billing Statements</h1>
            <p className="text-muted">View and download your monthly statements.</p>
        </div>
      
        {loading ? (
            <div className="loading-state glass-panel p-8 text-center">
                <p>Loading statements...</p>
            </div>
        ) : (
            <div className="statements-list glass-panel">
            {statements.length === 0 ? (
                <div className="empty-state p-8 text-center">
                    <FileText size={48} className="mx-auto mb-4 text-muted" />
                    <p>No statements found.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="w-full">
                    <thead>
                        <tr className="text-left border-b border-white/10">
                        <th className="p-4">Period</th>
                        <th className="p-4">Date Available</th>
                        <th className="p-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {statements.map((statement) => (
                        <tr key={statement.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 font-medium">
                                <div className="flex items-center gap-3">
                                    <FileText size={18} className="text-primary" />
                                    {new Date(statement.period).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                                </div>
                            </td>
                            <td className="p-4 text-muted">{new Date(statement.created_at).toLocaleDateString()}</td>
                            <td className="p-4 text-right">
                            <button 
                                onClick={() => handleDownload(statement.id, statement.period)}
                                className="btn-secondary inline-flex items-center gap-2 text-sm"
                            >
                                <Download size={16} />
                                Download PDF
                            </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            )}
            </div>
        )}
      </div>
      
      <div className="ambient-light light-1"></div>
      <div className="ambient-light light-2"></div>
    </div>
  );
};

export default Billing;
