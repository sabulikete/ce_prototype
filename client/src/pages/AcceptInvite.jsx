import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import './AcceptInvite.css';

const AcceptInvite = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [status, setStatus] = useState(token ? 'idle' : 'error'); // idle, processing, success, error
    const [msg, setMsg] = useState(token ? '' : 'Invalid invitation link.');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPass) {
            setMsg('Passwords do not match');
            return;
        }

        setStatus('processing');

        try {
            const res = await fetch(`/api/invites/${token}/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setStatus('error');
                setMsg(data.error || data.message || 'Activation failed');
            }
        } catch (err) {
            setStatus('error');
            setMsg('Network error occurred');
        }
    };

    if (status === 'success') {
        return (
            <div className="accept-container flex-center">
                <div className="card glass-panel text-center p-8">
                    <div className="icon-success mb-4">
                        <ShieldCheck size={48} className="text-success" />
                    </div>
                    <h2>Account Activated!</h2>
                    <p className="text-muted mb-4">Redirecting you to login...</p>
                </div>
                <div className="ambient-light light-1"></div>
            </div>
        );
    }

    return (
        <div className="accept-container flex-center">
            <div className="accept-card glass-panel">
                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold">Activate Account</h1>
                    <p className="text-muted">Set a password to complete registration.</p>
                </div>

                {status === 'error' && (
                    <div className="error-banner mb-4">
                        {msg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div className="input-group">
                        <input
                            type="password"
                            className="input-field"
                            placeholder="New Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Confirm Password"
                            value={confirmPass}
                            onChange={e => setConfirmPass(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full flex-center gap-2"
                        disabled={status === 'processing' || !token}
                    >
                        {status === 'processing' ? 'Activating...' : 'Activate Account'}
                        <ArrowRight size={18} />
                    </button>

                </form>
            </div>

            <div className="ambient-light light-1"></div>
            <div className="ambient-light light-2"></div>
        </div>
    );
};

export default AcceptInvite;
