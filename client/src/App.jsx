import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import AdminBilling from './pages/Admin/AdminBilling';
import AdminEvents from './pages/Admin/AdminEvents';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminPosts from './pages/Admin/AdminPosts';
import Scanner from './pages/Scanner';
import LandingPage from './pages/LandingPage';
import AcceptInvite from './pages/AcceptInvite';
import PostDetail from './pages/PostDetail';
import MyTickets from './components/Events/MyTickets';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />; // Redirect to dashboard if authorized but wrong role, or just stay put
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/post/:id" element={<PostDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />

      {/* Protected App Routes */}
      <Route path="/" element={<MainLayout />}>
        {/* Dashboard is no longer index, it's at /dashboard */}
        <Route path="dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="tickets" element={<ProtectedRoute allowedRoles={['MEMBER']}><MyTickets /></ProtectedRoute>} />
        <Route path="billing" element={<ProtectedRoute allowedRoles={['MEMBER']}><Billing /></ProtectedRoute>} />

        <Route path="admin/billing" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminBilling /></ProtectedRoute>} />
        <Route path="admin/events" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminEvents /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/posts" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPosts /></ProtectedRoute>} />
        <Route path="scanner" element={<ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}><Scanner /></ProtectedRoute>} />

      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
