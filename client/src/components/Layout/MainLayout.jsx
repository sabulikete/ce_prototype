import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import './MainLayout.css';

const MainLayout = () => {
    const { user } = useAuth();

    return (
        <div className="layout-container">
            {user && <Sidebar />}
            <main className={`main-content ${user ? 'with-sidebar' : ''}`}>
                <div className="content-wrapper">
                    <Outlet />
                </div>
            </main>

            {/* Ambient background effects */}
            <div className="ambient-light light-1"></div>
            <div className="ambient-light light-2"></div>
        </div>
    );
};

export default MainLayout;
