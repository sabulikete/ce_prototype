import React, { useCallback, useEffect, useState } from 'react';
import {
  UserPlus,
  Shield,
  User,
  Trash2,
  Link as LinkIcon,
  Check,
  XCircle,
  CheckCircle,
  RefreshCw,
  Search,
  AlertTriangle,
  Send,
  Ban,
} from 'lucide-react';
import {
  fetchAdminUserRows,
  createInvite,
  updateUser,
  deleteUser,
  resendInvite,
  revokeInvite,
  getErrorMessage,
} from '../../services/api';
import AdminUserStatusTabs from '../../components/UI/Tabs/AdminUserStatusTabs';
import { useAdminUserFilters, AdminUserTabKey } from './UserManagement/state';
import { useToast } from '../../context/ToastContext';
import './AdminUsers.css';

type InviteConflictFlag =
  | { type: 'DEACTIVATED_USER'; userId: number; status: 'ACTIVE' | 'SUSPENDED' | 'INVITED' }
  | { type: 'DUPLICATE_EMAIL'; inviteIds: number[] };

interface InviteActionPermissions {
  canResend: boolean;
  canRevoke: boolean;
  maxReminders: number;
}

interface InvitationMetadata {
  sentAt: string;
  lastSentAt: string;
  expiresAt: string;
  reminderCount: number;
  status: 'PENDING' | 'EXPIRED' | 'REVOKED' | 'ACCEPTED';
  inviter?: {
    id: number;
    name?: string | null;
    role?: 'ADMIN' | 'STAFF' | 'MEMBER' | null;
  } | null;
  revokedAt?: string | null;
  conflictFlags?: InviteConflictFlag[];
  permissions?: InviteActionPermissions;
}

interface UserInviteRow {
  id: number;
  source: 'USER' | 'INVITE';
  email: string;
  fullName?: string | null;
  role: 'ADMIN' | 'STAFF' | 'MEMBER';
  status: string;
  joinedAt?: string | null;
  lastLogin?: string | null;
  invitation?: InvitationMetadata | null;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
}

const DEFAULT_PAGE_SIZE = 25;

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString();
  } catch (error) {
    return '—';
  }
};

const AdminUsers: React.FC = () => {
  const { showToast } = useToast();
  const { view, setView, search, page, updateSearch, updatePage, clearViewFilters, resetToDefaultActive } =
    useAdminUserFilters();
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
  const [rows, setRows] = useState<UserInviteRow[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'MEMBER', name: '' });
  const [sending, setSending] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadAdminUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchAdminUserRows({
        view,
        page,
        search: debouncedSearch || undefined,
      });
      setRows(response.data);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Failed to load admin users', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin users');
    } finally {
      setIsLoading(false);
    }
  }, [view, page, debouncedSearch]);

  useEffect(() => {
    loadAdminUsers();
  }, [loadAdminUsers]);

  const handleInviteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInviteData(prev => ({ ...prev, [name]: value }));
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await createInvite(inviteData.email, inviteData.role, inviteData.name);
      setGeneratedLink(res.inviteLink);
      if (view !== 'invited') {
        setView('invited');
      } else {
        await loadAdminUsers();
      }
      showToast('Invitation link generated', 'success');
    } catch (error) {
      console.error('Failed to create invite', error);
      showToast(getErrorMessage(error, 'Failed to create invite'), 'error');
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

  const handleStatusChange = async (row: UserInviteRow) => {
    if (row.source !== 'USER') return;
    const isActive = row.status === 'ACTIVE';
    const targetStatus = isActive ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Change ${row.email} to ${targetStatus}?`)) return;

    try {
      await updateUser(row.id, { status: targetStatus });
      setRows(prev =>
        prev.map(existing =>
          existing.source === 'USER' && existing.id === row.id
            ? { ...existing, status: targetStatus }
            : existing,
        ),
      );
      showToast(`User ${targetStatus === 'ACTIVE' ? 're-activated' : 'suspended'}`, 'success');
    } catch (error) {
      console.error('Failed to update status', error);
      showToast(getErrorMessage(error, 'Failed to update status'), 'error');
    }
  };

  const handleDelete = async (row: UserInviteRow) => {
    if (row.source !== 'USER') return;
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await deleteUser(row.id);
      setRows(prev => prev.filter(existing => !(existing.source === 'USER' && existing.id === row.id)));
      showToast('User deleted', 'success');
    } catch (error) {
      console.error('Failed to delete user', error);
      showToast(getErrorMessage(error, 'Failed to delete user'), 'error');
    }
  };

  const handleResendInvite = async (row: UserInviteRow) => {
    if (row.source !== 'INVITE' || !row.invitation?.permissions?.canResend) return;
    setResendingId(row.id);
    try {
      await resendInvite(row.id);
      showToast('Invitation resent', 'success');
      await loadAdminUsers();
    } catch (error) {
      console.error('Failed to resend invite', error);
      showToast(getErrorMessage(error, 'Failed to resend invite'), 'error');
    } finally {
      setResendingId(null);
    }
  };

  const handleRevokeInvite = async (row: UserInviteRow) => {
    if (row.source !== 'INVITE' || !row.invitation?.permissions?.canRevoke) return;
    const reasonInput = prompt('Provide a reason for revoking this invite (optional)');
    if (reasonInput === null) {
      return;
    }
    setRevokingId(row.id);
    try {
      const reason = reasonInput.trim();
      await revokeInvite(row.id, reason.length ? reason : undefined);
      showToast('Invitation revoked', 'success');
      await loadAdminUsers();
    } catch (error) {
      console.error('Failed to revoke invite', error);
      showToast(getErrorMessage(error, 'Failed to revoke invite'), 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const handleTabChange = (nextView: AdminUserTabKey) => {
    if (nextView !== view) {
      setView(nextView);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSearch(e.target.value);
  };

  const handleClearFilters = () => {
    if (view !== 'invited') {
      clearViewFilters(view);
    }
    resetToDefaultActive();
  };

  const goToPreviousPage = () => updatePage(prev => prev - 1);
  const goToNextPage = () => updatePage(prev => prev + 1);

  const handleRefresh = () => {
    loadAdminUsers();
  };

  const hasActiveFilters = view !== 'active' || search.trim().length > 0 || page !== 1;
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));

  const renderConflictFlags = (flags?: InviteConflictFlag[]) => {
    if (!flags?.length) return null;
    return (
      <div className="conflict-flags">
        {flags.map((flag, index) => (
          <span key={`${flag.type}-${index}`} className="conflict-badge">
            {flag.type === 'DEACTIVATED_USER' ? 'Linked to deactivated user' : 'Duplicate invite'}
          </span>
        ))}
      </div>
    );
  };

  const renderStatusBadge = (row: UserInviteRow) => {
    if (row.source === 'INVITE' && row.invitation) {
      const normalized = row.invitation.status.toLowerCase();
      const label = row.invitation.status === 'PENDING'
        ? 'Invited'
        : row.invitation.status.charAt(0) + row.invitation.status.slice(1).toLowerCase();
      return <span className={`status-badge ${normalized}`}>{label}</span>;
    }
    return <span className={`status-badge ${row.status.toLowerCase()}`}>{row.status}</span>;
  };

  const renderInvitationCell = (row: UserInviteRow) => {
    if (row.source === 'INVITE' && row.invitation) {
      const maxReminders = row.invitation.permissions?.maxReminders;
      return (
        <div className="invitation-meta">
          <div>
            <span className="meta-label">Sent</span>
            <span>{formatDate(row.invitation.sentAt)}</span>
          </div>
          <div>
            <span className="meta-label">Last Sent</span>
            <span>{formatDate(row.invitation.lastSentAt)}</span>
          </div>
          <div>
            <span className="meta-label">Reminders</span>
            <span>
              {row.invitation.reminderCount}
              {typeof maxReminders === 'number' ? ` / ${maxReminders}` : ''}
            </span>
          </div>
          {row.invitation.inviter && (
            <div>
              <span className="meta-label">Inviter</span>
              <span>{row.invitation.inviter.name || row.invitation.inviter.role || '—'}</span>
            </div>
          )}
          {renderConflictFlags(row.invitation.conflictFlags)}
        </div>
      );
    }

    return (
      <div className="invitation-meta">
        <div>
          <span className="meta-label">Joined</span>
          <span>{formatDate(row.joinedAt)}</span>
        </div>
      </div>
    );
  };

  const renderActivityCell = (row: UserInviteRow) => {
    if (row.source === 'INVITE' && row.invitation) {
      const isExpired = row.invitation.status === 'EXPIRED';
      const isRevoked = row.invitation.status === 'REVOKED';
      return (
        <div className="invitation-meta">
          <div>
            <span className="meta-label">Expires</span>
            <span className={isExpired ? 'text-warning' : ''}>{formatDate(row.invitation.expiresAt)}</span>
          </div>
          {isRevoked && row.invitation.revokedAt && (
            <div>
              <span className="meta-label">Revoked</span>
              <span>{formatDate(row.invitation.revokedAt)}</span>
            </div>
          )}
          <div>
            <span className="meta-label">Status</span>
            {renderStatusBadge(row)}
          </div>
        </div>
      );
    }

    return <span>{formatDate(row.lastLogin)}</span>;
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
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleRefresh} title="Refresh invited data">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowInviteModal(true)}>
            <UserPlus size={18} /> Invite User
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <AdminUserStatusTabs value={view} onChange={handleTabChange} />
        <div className="toolbar-inputs">
          <div className="search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by email"
              value={search}
              onChange={handleSearchChange}
            />
          </div>
          <button className="clear-filter-btn" onClick={handleClearFilters} disabled={!hasActiveFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <p className="manual-refresh-hint">
        Invited statuses refresh when you reload or click Refresh. Use the action buttons to resend or revoke invites
        without leaving this page.
      </p>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {isLoading ? (
        <div className="loading">Loading users…</div>
      ) : (
        <div className="users-list">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>{view === 'invited' ? 'Invitation' : 'Membership'}</th>
                <th>{view === 'invited' ? 'Lifecycle' : 'Last Login'}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      {view === 'invited'
                        ? 'No pending invites found. Generate one to see it here.'
                        : 'No users match this filter yet.'}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={`${row.source}-${row.id}`}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">
                          <User size={16} />
                        </div>
                        <div className="user-info">
                          <span className="user-name">{row.fullName || row.email.split('@')[0]}</span>
                          <span className="user-email">{row.email}</span>
                          {row.source === 'INVITE' && <span className="badge subtle">Invite pending</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${row.role.toLowerCase()}`}>
                        {row.role === 'ADMIN' && <Shield size={12} />}
                        {row.role}
                      </span>
                    </td>
                    <td>
                      {renderStatusBadge(row)}
                    </td>
                    <td>{renderInvitationCell(row)}</td>
                    <td>{renderActivityCell(row)}</td>
                    <td className="actions-cell">
                      {row.source === 'USER' ? (
                        <>
                          <button
                            className={`icon-btn ${row.status === 'ACTIVE' ? 'danger' : 'success'}`}
                            onClick={() => handleStatusChange(row)}
                            title={row.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          >
                            {row.status === 'ACTIVE' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                          </button>
                          <button className="icon-btn danger" onClick={() => handleDelete(row)} title="Delete">
                            <Trash2 size={18} />
                          </button>
                        </>
                      ) : (
                        <div className="invite-actions">
                          <button
                            className="invite-action-btn"
                            onClick={() => handleResendInvite(row)}
                            disabled={
                              !row.invitation?.permissions?.canResend || resendingId === row.id || isLoading
                            }
                            title={row.invitation?.permissions?.canResend ? 'Resend invite' : 'Resend unavailable'}
                          >
                            <Send size={14} />
                            <span>Resend</span>
                          </button>
                          <button
                            className="invite-action-btn danger"
                            onClick={() => handleRevokeInvite(row)}
                            disabled={
                              !row.invitation?.permissions?.canRevoke || revokingId === row.id || isLoading
                            }
                            title={row.invitation?.permissions?.canRevoke ? 'Revoke invite' : 'Already revoked'}
                          >
                            <Ban size={14} />
                            <span>Revoke</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {pagination.total > pagination.pageSize && (
            <div className="table-pagination">
              <button className="pagination-btn" onClick={goToPreviousPage} disabled={page === 1}>
                Prev
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={goToNextPage}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          )}
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