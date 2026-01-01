import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchContent } from '../services/api';
import { Link } from 'react-router-dom';
import { Bell, Calendar, Receipt, TrendingUp } from 'lucide-react';
import './Dashboard.css';

interface Content {
  id: number;
  title: string;
  body: string;
  type: string;
  published_at: string;
  is_pinned: boolean;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const data = await fetchContent(undefined, 5); // Limit 5
        setContent(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  const displayName =
    (user as any)?.name ||
    (user as any)?.displayName ||
    (user?.email ? user.email.split('@')[0] : undefined);

  return (
    <div className="dashboard fade-in">
      <header className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {displayName || user?.email}</h1>
          <p className="text-muted">Here's what's happening at your property today.</p>
        </div>
        <div className="date-badge glass-panel">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <button onClick={logout} className="btn-secondary">Logout</button>
      </header>

      <div className="dashboard-grid">
        <Link to="/billing" className="dashboard-card glass-panel hover-card">
            <Receipt className="text-primary mb-2" size={24} />
            <h3>My Billing</h3>
            <p className="text-sm text-muted">View statements</p>
        </Link>
        <Link to="/tickets" className="dashboard-card glass-panel hover-card">
            <TrendingUp className="text-primary mb-2" size={24} />
            <h3>My Tickets</h3>
            <p className="text-sm text-muted">View event tickets</p>
        </Link>
      </div>

      <section className="recent-content mt-8">
        <h2 className="text-xl font-bold mb-4">Recent Updates</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="content-list grid gap-4">
            {content.map((item) => (
              <div key={item.id} className="content-card glass-panel p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="badge type text-xs font-bold uppercase tracking-wider text-primary mb-1 block">{item.type}</span>
                        <h3 className="text-lg font-medium"><Link to={`/post/${item.id}`}>{item.title}</Link></h3>
                    </div>
                    <span className="date text-sm text-muted">{new Date(item.published_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
