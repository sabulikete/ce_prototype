import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Shield, User, Trash2, Link as LinkIcon, Check, XCircle, CheckCircle } from 'lucide-react';
import { fetchUsers, createInvite, updateUser, deleteUser } from '../../services/api';
import './AdminUsers.css';

interface UserData {
  id: number;
  email: string;
  // name: string; // Removed as it's not in the Prisma schema
  role: 'ADMIN' | 'STAFF' | 'MEMBER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
  last_login_at: string | null;
  invite_link?: string; // Added locally after invite generation
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'MEMBER', name: '' });
  const [sending, setSending] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInviteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInviteData(prev => ({ ...prev, [name]: value }));
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // Name is not stored in User model, but might be used for email or other purposes in invite
      const res = await createInvite(inviteData.email, inviteData.role, inviteData.name);
      setGeneratedLink(res.inviteLink);
      // Optionally reload users if the invite creates a placeholder user, but usually it doesn't until accepted
      // But if we want to show pending invites, we'd need a separate list or table.
      // For now, just show the link.
    } catch (error) {
      console.error('Failed to create invite', error);
      alert('Failed to create invite');
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStatusChange = async (user: UserData) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    
    try {
      await updateUser(user.id, { status: newStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Failed to delete user', error);
    }
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setGeneratedLink(null);
    setInviteData({ email: '', role: 'MEMBER', name: '' });
  };

  return (
    <div className="admin-users-container">
      <div className="admin-header">
        <h1>User Management</h1>
        <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
          <UserPlus size={18} /> Invite User
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="users-list">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">
                        <User size={16} />
                      </div>
                      <div className="user-info">
                        {/* Name is not in schema, using email part as display name */}
                        <span className="user-name">{user.email.split('@')[0]}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                      {user.role === 'ADMIN' && <Shield size={12} />}
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status.toLowerCase()}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : '-'}</td>
                  <td className="actions-cell">
                    <button 
                      className={`icon-btn ${user.status === 'ACTIVE' ? 'danger' : 'success'}`} 
                      onClick={() => handleStatusChange(user)}
                      title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      {user.status === 'ACTIVE' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(user.id)} title="Delete">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Invite New User</h2>
            {!generatedLink ? (
              <form onSubmit={handleInviteSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={inviteData.name} 
                    onChange={handleInviteChange} 
                    required 
                    placeholder="Full Name"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={inviteData.email} 
                    onChange={handleInviteChange} 
                    required 
                    placeholder="user@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select name="role" value={inviteData.role} onChange={handleInviteChange}>
                    <option value="MEMBER">Member</option>
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeInviteModal}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={sending}>
                    {sending ? 'Generating...' : 'Generate Invite Link'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="invite-success">
                <div className="success-icon">
                  <CheckCircle size={48} color="#34d399" />
                </div>
                <h3>Invite Link Generated!</h3>
                <p>Share this link with the user to let them sign up.</p>
                <div className="link-box">
                  <input type="text" value={generatedLink} readOnly />
                  <button onClick={copyToClipboard} className="copy-btn">
                    {copied ? <Check size={18} /> : <LinkIcon size={18} />}
                  </button>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-primary" onClick={closeInviteModal}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;