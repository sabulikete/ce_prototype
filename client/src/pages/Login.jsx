import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('member@ce.app');
    const [password, setPassword] = useState('member');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container flex-center">
            <div className="login-card glass-panel flex-col gap-4">
                <div className="login-header">
                    <h1 className="text-gradient" style={{ fontSize: '2rem', margin: 0 }}>CE APP</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Sign in to your account</p>
                </div>

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div className="input-group">
                        <Mail size={18} className="input-icon" />
                        <input
                            type="email"
                            className="input-field with-icon"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <Lock size={18} className="input-icon" />
                        <input
                            type="password"
                            className="input-field with-icon"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="error-msg">{error}</div>}

                    <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="demo-credentials">
                    <p>Demo Credentials:</p>
                    <div className="cred-row" onClick={() => { setEmail('admin@ce.app'); setPassword('admin'); }}>
                        <span>Admin:</span> admin@ce.app / admin
                    </div>
                    <div className="cred-row" onClick={() => { setEmail('member@ce.app'); setPassword('member'); }}>
                        <span>Member:</span> member@ce.app / member
                    </div>
                </div>
            </div>

            {/* Background lights for login too */}
            <div className="ambient-light light-1"></div>
            <div className="ambient-light light-2"></div>
        </div>
    );
};

export default Login;
