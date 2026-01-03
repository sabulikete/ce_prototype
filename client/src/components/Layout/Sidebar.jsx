import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Receipt,
    Calendar,
    Upload,
    QrCode,
    LogOut,
    User,
    Megaphone,
    Menu,
    X,
    ScanLine
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const closeMobile = () => setMobileOpen(false);

    return (
        <>
            {/* Mobile Menu Toggle */}
            <button
                className="mobile-menu-toggle glass-panel"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
            >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Mobile Overlay */}
            <div
                className={`mobile-overlay ${mobileOpen ? 'active' : ''}`}
                onClick={closeMobile}
            />

            <aside className={`sidebar glass-panel ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <h1 className="logo text-gradient">CE APP</h1>
                    <div className="user-info">
                        <div className="avatar">
                            <User size={20} />
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user.name}</span>
                            <span className="user-role">{user.role}</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    {user.role === 'MEMBER' && (
                        <>
                            <NavLink to="/billing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                                <Receipt size={20} />
                                <span>My Billing</span>
                            </NavLink>
                            <NavLink to="/tickets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                                <QrCode size={20} />
                                <span>My Tickets</span>
                            </NavLink>
                        </>
                    )}

                    {user.role === 'ADMIN' && (
                        <>
                            <div className="nav-section-label">ADMINISTRATION</div>
                            <NavLink to="/scanner" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                                <ScanLine size={20} />
                                <span>Ticket Scanner</span>
                            </NavLink>
                            <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                                <User size={20} />
                                <span>User Management</span>
                            </NavLink>
                            <NavLink to="/admin/posts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                                <Megaphone size={20} />
                                <span>Content</span>
                            </NavLink>
                            <NavLink to="/admin/billing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                                <Upload size={20} />
                                <span>Billing Upload</span>
                            </NavLink>
                            <NavLink to="/admin/events" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                                <QrCode size={20} />
                                <span>Event Manager</span>
                            </NavLink>
                        </>
                    )}

                    {user.role === 'STAFF' && (
                        <>
                            <div className="nav-section-label">STAFF TOOLS</div>
                            <NavLink to="/scanner" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={closeMobile}>
                                <ScanLine size={20} />
                                <span>Ticket Scanner</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="nav-item logout-btn">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
