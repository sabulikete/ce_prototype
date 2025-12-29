import { useState, useEffect } from 'react';
import { UserPlus, Mail, Shield, User, Trash2, Link as LinkIcon, Check } from 'lucide-react';
import './AdminUsers.css';

const AdminUsers = () => {
    // Determine initial state: prioritize DB fetch if empty? 
    // Actually best practice is to start empty/loading and fetch.
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({ email: '', role: 'MEMBER', name: '' });
    const [sending, setSending] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const handleCopyLink = (u) => {
        if (!u.invite_link) return;
        navigator.clipboard.writeText(window.location.origin + u.invite_link);
        setCopiedId(u.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Fetch Users from API
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await fetch('/api/users');
                // If proxy is not yet working seamlessly in dev without restart, use full URL or ensure proxy
                const data = await res.json();
                if (Array.isArray(data)) {
                    setUsers(data);
                }
            } catch (err) {
                console.error("Failed to fetch users", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleInviteChange = (e) => {
        setInviteData({ ...inviteData, [e.target.name]: e.target.value });
    };

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        setSending(true);

        try {
            const res = await fetch('/api/users/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inviteData)
            });

            if (!res.ok) throw new Error('Failed to invite');

            const newUser = await res.json();
            setUsers([...users, newUser]);
            setShowInviteModal(false);
            setInviteData({ email: '', role: 'MEMBER', name: '' });
            alert(`Invitation sent to ${inviteData.email}!`);
        } catch (err) {
            alert(err.message);
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to remove this user?')) {
            try {
                await fetch(`/api/users/${id}`, { method: 'DELETE' });
                setUsers(users.filter(u => u.id !== id));
            } catch (err) {
                alert("Failed to delete user");
            }
        }
    };

    return (
        <div className="admin-users fade-in">
            <header className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-muted">Manage system access and send invites</p>
                </div>
            </header>

            <div className="content-block glass-panel">
                <div className="table-header-actions">
                    <h2 className="text-lg font-semibold">All Users</h2>
                    <button className="btn-primary flex-center gap-2" onClick={() => setShowInviteModal(true)}>
                        <UserPlus size={18} /> Invite New User
                    </button>
                </div>

                <div className="table-responsive">
                    {isLoading ? <p className="p-4">Loading users...</p> : (
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left p-4 text-muted">User</th>
                                    <th className="text-left p-4 text-muted">Role</th>
                                    <th className="text-left p-4 text-muted">Status</th>
                                    <th className="text-right p-4 text-muted">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-t border-light hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                                                <div className="avatar-small">
                                                    {u.role === 'ADMIN' ? <Shield size={14} /> : <User size={14} />}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{u.name || 'No Name'}</div>
                                                    <div className="text-sm text-muted">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`role-badge ${u.role.toLowerCase()}`}>{u.role}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`status-dot ${u.status.toLowerCase()}`}></span> {u.status}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex-center gap-2" style={{ justifyContent: 'flex-end' }}>
                                                {u.status === 'Invited' && u.invite_token && (
                                                    <button
                                                        className="btn-ghost text-primary"
                                                        onClick={() => {
                                                            const link = `/accept-invite?token=${u.invite_token}`;
                                                            navigator.clipboard.writeText(window.location.origin + link);
                                                            setCopiedId(u.id);
                                                            setTimeout(() => setCopiedId(null), 2000);
                                                        }}
                                                        title="Copy Invite Link"
                                                    >
                                                        {copiedId === u.id ? <Check size={16} /> : <LinkIcon size={16} />}
                                                    </button>
                                                )}
                                                <button
                                                    className="btn-ghost text-error"
                                                    onClick={() => handleDelete(u.id)}
                                                    title="Remove User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="modal-overlay flex-center">
                    <div className="modal glass-panel">
                        <h2 className="mb-4 flex-center gap-2" style={{ justifyContent: 'flex-start' }}>
                            <Mail size={20} className="text-primary" /> Send Invitation
                        </h2>
                        <form onSubmit={handleInviteSubmit} className="flex-col gap-4">

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="input-field"
                                    placeholder="user@example.com"
                                    value={inviteData.email}
                                    onChange={handleInviteChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Name (Optional)</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input-field"
                                    placeholder="John Doe"
                                    value={inviteData.name}
                                    onChange={handleInviteChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    name="role"
                                    className="input-field"
                                    value={inviteData.role}
                                    onChange={handleInviteChange}
                                >
                                    <option value="MEMBER">Member</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div className="flex-row gap-2 mt-4">
                                <button
                                    type="button"
                                    className="btn-ghost flex-1"
                                    onClick={() => setShowInviteModal(false)}
                                    disabled={sending}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary flex-1"
                                    disabled={sending}
                                >
                                    {sending ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
