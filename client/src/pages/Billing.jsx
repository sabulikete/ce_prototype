import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { format, subMonths, isAfter, startOfMonth } from 'date-fns';
import './Billing.css';

const Billing = () => {
    const { user } = useAuth();
    const [statements, setStatements] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock API Call
    useEffect(() => {
        // Simulate fetching logic
        const fetchStatements = async () => {
            setLoading(true);

            // Calculate threshold: 2 months ago from now, first day
            const now = new Date();
            const threshold = startOfMonth(subMonths(now, 2));

            // Mock Data (Some accessible, some not if we were blindly fetching all)
            // But API should only return valid ones.
            const mockData = [
                { id: 101, billingMonth: new Date(2025, 11, 1), amount: 12500.00, status: 'UNPAID' }, // Dec 2025
                { id: 102, billingMonth: new Date(2025, 10, 1), amount: 12500.00, status: 'PAID' },   // Nov 2025
                { id: 103, billingMonth: new Date(2025, 9, 1), amount: 12500.00, status: 'PAID' },    // Oct 2025
                { id: 104, billingMonth: new Date(2025, 8, 1), amount: 12500.00, status: 'PAID' },    // Sep 2025 (Should be hidden if now is Dec)
            ];

            // Filter based on 3-month rolling window
            const filtered = mockData.filter(s => isAfter(s.billingMonth, subMonths(threshold, 0)));
            // Actually threshold logic: billing_month >= startOfMonth(now - 2 months)
            // If now is Dec, we want Oct, Nov, Dec.
            // subMonths(Dec, 2) = Oct. startOfMonth(Oct) = Oct 1.

            const valid = mockData.filter(s => s.billingMonth >= threshold);

            setTimeout(() => {
                setStatements(valid);
                setLoading(false);
            }, 600);
        };

        fetchStatements();
    }, []);

    const handleDownload = (id) => {
        alert(`Downloading statement #${id}... (Mock)`);
    };

    return (
        <div className="billing-page fade-in">
            <header className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Billing Statements</h1>
                    <p className="text-muted">Unit {user.unit} • History limited to last 3 months</p>
                </div>
            </header>

            <div className="glass-panel card">
                {loading ? (
                    <div className="p-4 text-center text-muted">Loading statements...</div>
                ) : statements.length === 0 ? (
                    <div className="p-8 text-center flex-col flex-center gap-4">
                        <AlertCircle size={48} className="text-muted" />
                        <p>No statements available for the current period.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left p-4 text-muted">Billing Month</th>
                                    <th className="text-left p-4 text-muted">Amount</th>
                                    <th className="text-left p-4 text-muted">Status</th>
                                    <th className="text-right p-4 text-muted">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statements.map(stmt => (
                                    <tr key={stmt.id} className="border-t border-light hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium">
                                            <div className="flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                                                <FileText size={18} className="text-primary" />
                                                {format(stmt.billingMonth, 'MMMM yyyy')}
                                            </div>
                                        </td>
                                        <td className="p-4">₱{stmt.amount.toLocaleString()}</td>
                                        <td className="p-4">
                                            <span className={`status-badge ${stmt.status.toLowerCase()}`}>
                                                {stmt.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDownload(stmt.id)}
                                                className="btn-ghost flex-center gap-2 inline-flex"
                                            >
                                                <Download size={16} />
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-8 text-sm text-muted">
                <p>* Statements older than 3 months are archived for security. Please contact administration for historical records.</p>
            </div>
        </div>
    );
};

export default Billing;
