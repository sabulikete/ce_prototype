import React, { useEffect, useState } from 'react';
import { fetchContent } from '../services/api';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Pin, Tag } from 'lucide-react';
import './LandingPage.css';

interface Content {
  id: number;
  title: string;
  body: string;
  type: string;
  published_at: string;
  is_pinned: boolean;
}

const LandingPage: React.FC = () => {
  const [content, setContent] = useState<Content[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const data = await fetchContent(filter || undefined);
        setContent(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [filter]);

  return (
    <div className="landing-page">
      <nav className="landing-nav glass-panel">
        <div className="brand">
          <div className="logo-mark">CE</div>
          <span className="logo-text">Community Events</span>
        </div>
        <Link to="/login" className="btn-primary btn-sm">Member Login</Link>
      </nav>

      <header className="hero-section">
        <div className="hero-content">
          <h1 className="text-gradient">Welcome to Your Community</h1>
          <p className="hero-subtitle">Stay connected with the latest news, events, and activities happening in your neighborhood.</p>
        </div>
        <div className="hero-glow"></div>
      </header>

      <main className="main-content">
        <div className="filters-container">
          <button onClick={() => setFilter('')} className={`filter-btn ${!filter ? 'active' : ''}`}>All Updates</button>
          <button onClick={() => setFilter('ANNOUNCEMENT')} className={`filter-btn ${filter === 'ANNOUNCEMENT' ? 'active' : ''}`}>Announcements</button>
          <button onClick={() => setFilter('ACTIVITY')} className={`filter-btn ${filter === 'ACTIVITY' ? 'active' : ''}`}>Activities</button>
          <button onClick={() => setFilter('EVENT')} className={`filter-btn ${filter === 'EVENT' ? 'active' : ''}`}>Events</button>
        </div>

        {loading ? (
          <div className="loading-state">Loading updates...</div>
        ) : (
          <div className="content-grid">
            {content.map((item) => (
              <Link to={`/post/${item.id}`} key={item.id} className={`content-card glass-panel ${item.is_pinned ? 'pinned' : ''}`}>
                <div className="card-header">
                  <div className="badges">
                    {item.is_pinned && <span className="badge pinned"><Pin size={12} /> Pinned</span>}
                    <span className="badge type"><Tag size={12} /> {item.type}</span>
                  </div>
                  <span className="date"><Calendar size={14} /> {new Date(item.published_at).toLocaleDateString()}</span>
                </div>
                <h2>{item.title}</h2>
                <p className="excerpt">{item.body.substring(0, 120)}...</p>
                <div className="card-footer">
                  <span className="read-more">Read more <ArrowRight size={16} /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Community Events Portal. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
