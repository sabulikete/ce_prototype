import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Bell, ChevronRight, ArrowRight, User } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [publicEvents, setPublicEvents] = useState([]);

    useEffect(() => {
        // Fetch Public Data
        const fetchData = async () => {
            try {
                const [annRes, evtRes] = await Promise.all([
                    fetch('/api/posts?type=announcement&visibility=public'),
                    fetch('/api/posts?type=event&visibility=public&upcoming=true')
                ]);

                const annData = await annRes.json();
                const evtData = await evtRes.json();

                if (Array.isArray(annData)) setAnnouncements(annData);
                if (Array.isArray(evtData)) setPublicEvents(evtData);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="landing-page">
            {/* Navigation */}
            <nav className="landing-nav glass-panel">
                <div className="nav-content">
                    <div className="brand">
                        <div className="logo-mark">CE</div>
                        <span className="logo-text">Community<span className="text-gradient">App</span></span>
                    </div>
                    <div className="nav-actions">
                        {user ? (
                            <Link to="/dashboard" className="btn-primary flex-center gap-2">
                                <User size={18} />
                                Go to Dashboard
                            </Link>
                        ) : (
                            <Link to="/login" className="btn-primary flex-center gap-2">
                                Member Login
                                <ArrowRight size={18} />
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="ambient-light hero-light-1"></div>
                <div className="ambient-light hero-light-2"></div>

                <div className="hero-content text-center">
                    <span className="hero-badge">Welcome to the Future of Living</span>
                    <h1 className="hero-title">
                        Your Community, <br />
                        <span className="text-gradient">Connected.</span>
                    </h1>
                    <p className="hero-subtitle">
                        Stay updated with the latest announcements, events, and community news.
                    </p>
                </div>
            </section>

            {/* Content Grid */}
            <section className="content-section">
                <div className="content-container">

                    {/* Announcements */}
                    <div className="section-block">
                        <div className="section-header-row">
                            <h2><Bell className="icon-mr" /> Public Announcements</h2>
                            <span className="see-all">Latest Updates</span>
                        </div>
                        <div className="cards-grid">
                            {announcements.map(item => (
                                <Link to={`/post/${item.id}`} key={item.id} className="card glass-panel hover-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="card-top">
                                        <span className="tag">Announcement</span>
                                        <span className="date">{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3>{item.title}</h3>
                                    <p className="text-muted">{item.content}</p>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Events */}
                    <div className="section-block">
                        <div className="section-header-row">
                            <h2><Calendar className="icon-mr" /> Upcoming Events</h2>
                            <span className="see-all">Join Us</span>
                        </div>
                        <div className="cards-grid">
                            {publicEvents.map(evt => (
                                <Link to={`/post/${evt.id}`} key={evt.id} className="card glass-panel hover-card event-public-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="event-emoji">📅</div>
                                    <div className="event-info">
                                        <h3>{evt.title}</h3>
                                        <p className="text-primary font-medium">{new Date(evt.event_start_at).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                                        <p className="text-muted text-sm">{evt.location}</p>
                                    </div>
                                    <div className="event-action">
                                        <button className="btn-ghost icon-btn"><ChevronRight size={20} /></button>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </section>

            <footer className="landing-footer text-muted text-center">
                <p>&copy; 2025 CE App. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
