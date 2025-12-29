import { useAuth } from '../context/AuthContext';
import { Bell, Calendar, Receipt, TrendingUp } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div className="dashboard fade-in">
            <header className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Welcome back, {user.name.split(' ')[0]}</h1>
                    <p className="text-muted">Here's what's happening at your property today.</p>
                </div>
                <div className="date-badge glass-panel">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </header>

            {/* Announcements Section */}
            <section className="dashboard-section">
                <div className="section-header">
                    <h2><Bell size={20} /> Latest Announcements</h2>
                </div>
                <div className="card glass-panel announcement-card">
                    <div className="announcement-tag urgent">Maintenance</div>
                    <h3>Pool Maintenance Scheduled</h3>
                    <p className="text-muted">The main pool will be closed for scheduled maintenance this weekend (Dec 30 - Jan 1). We apologize for the inconvenience.</p>
                    <div className="announcement-meta">Posted 2 hours ago by Management</div>
                </div>
                <div className="card glass-panel announcement-card">
                    <div className="announcement-tag info">Event</div>
                    <h3>New Year's Eve Party!</h3>
                    <p className="text-muted">Join us at the clubhouse for a countdown party. RSVP required.</p>
                    <div className="announcement-meta">Posted 1 day ago by Events Committee</div>
                </div>
            </section>

            {/* Quick Stats / Actions */}
            <div className="dashboard-grid">
                <div className="card glass-panel stat-card">
                    <div className="icon-box primary">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <h3>Outstanding Balance</h3>
                        <p className="stat-value">₱0.00</p>
                        <p className="stat-desc text-success">You are fully paid!</p>
                    </div>
                </div>

                <div className="card glass-panel stat-card">
                    <div className="icon-box secondary">
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h3>Next Event</h3>
                        <p className="stat-value">NYE 2024</p>
                        <p className="stat-desc">Dec 31, 8:00 PM</p>
                    </div>
                </div>

                <div className="card glass-panel stat-card">
                    <div className="icon-box warning">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3>Utility Usage</h3>
                        <p className="stat-value">145 kWh</p>
                        <p className="stat-desc">-5% from last month</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
