import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutDashboard,
    Receipt,
    Calendar,
    Upload,
    QrCode,
    LogOut,
    User
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside className="sidebar glass-panel">
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
                <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>

                {user.role === 'MEMBER' && (
                    <>
                        <NavLink to="/billing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Receipt size={20} />
                            <span>My Billing</span>
                        </NavLink>
                        <NavLink to="/events" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Calendar size={20} />
                            <span>Events</span>
                        </NavLink>
                    </>
                )}

                {user.role === 'ADMIN' && (
                    <>
                        <div className="nav-section-label">ADMINISTRATION</div>
                        <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <User size={20} />
                            <span>User Management</span>
                        </NavLink>
                        <NavLink to="/admin/billing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <Upload size={20} />
                            <span>Billing Upload</span>
                        </NavLink>
                        <NavLink to="/admin/events" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <QrCode size={20} />
                            <span>Event Manager</span>
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
    );
};

export default Sidebar;
