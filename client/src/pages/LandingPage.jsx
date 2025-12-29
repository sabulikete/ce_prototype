import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Bell, ChevronRight, ArrowRight, User } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    const { user } = useAuth();

    // Mock Public Data
    const announcements = [
        {
            id: 1,
            tag: 'Community',
            title: 'Summer Community Bazaar',
            content: 'Join us this weekend for our annual community bazaar featuring local vendors and food stalls.',
            date: 'Aug 15, 2025'
        },
        {
            id: 2,
            tag: 'Maintenance',
            title: 'Main Gate Renovations',
            content: 'The main entrance will shorter hours this week due to repainting. Please use the East Gate.',
            date: 'Aug 12, 2025'
        }
    ];

    const publicEvents = [
        {
            id: 101,
            title: 'YOGA by the Pool',
            date: 'Every Saturday, 7:00 AM',
            location: 'Clubhouse Poolside',
            image: '🧘‍♀️'
        },
        {
            id: 102,
            title: 'Town Hall Meeting',
            date: 'Sep 01, 2025 - 6:00 PM',
            location: 'Grand Hall',
            image: '🏛️'
        }
    ];

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
                                <div key={item.id} className="card glass-panel hover-card">
                                    <div className="card-top">
                                        <span className="tag">{item.tag}</span>
                                        <span className="date">{item.date}</span>
                                    </div>
                                    <h3>{item.title}</h3>
                                    <p className="text-muted">{item.content}</p>
                                </div>
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
                                <div key={evt.id} className="card glass-panel hover-card event-public-card">
                                    <div className="event-emoji">{evt.image}</div>
                                    <div className="event-info">
                                        <h3>{evt.title}</h3>
                                        <p className="text-primary font-medium">{evt.date}</p>
                                        <p className="text-muted text-sm">{evt.location}</p>
                                    </div>
                                    <div className="event-action">
                                        <button className="btn-ghost icon-btn"><ChevronRight size={20} /></button>
                                    </div>
                                </div>
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
