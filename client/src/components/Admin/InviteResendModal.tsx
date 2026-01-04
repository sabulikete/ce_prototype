import React, { useEffect, useState } from 'react';
import { X, Send, AlertCircle, Clock, User, Mail, RefreshCw, CheckCircle, Ban } from 'lucide-react';
import CopyableField from '../UI/CopyableField';
import { fetchInviteResendContext, resendInviteWithContext, ResendContextResponse } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import './InviteResendModal.css';

export interface InviteResendModalProps {
  /** The invite ID to fetch context for */
  inviteId: number;
  /** Called when the modal should close */
  onClose: () => void;
  /** Called after a successful resend with updated data */
  onResendSuccess?: (data: { reminderCount: number; resendEligible: boolean }) => void;
  /** Key to trigger refetch when changed (for auto-refresh support per FR-008) */
  refreshKey?: number;
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const InviteResendModal: React.FC<InviteResendModalProps> = ({
  inviteId,
  onClose,
  onResendSuccess,
  refreshKey = 0,
}) => {
  const { showToast } = useToast();
  const [context, setContext] = useState<ResendContextResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadContext = async () => {
      // Don't show loading spinner on refresh, only on initial load
      if (!context) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await fetchInviteResendContext(inviteId);
        if (!cancelled) {
          // Detect state change and notify user (FR-008)
          if (context && context.status !== data.status) {
            showToast(
              `Invite status changed to ${data.status.toLowerCase()}`,
              data.status === 'ACCEPTED' ? 'success' : 'info'
            );
          }
          setContext(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load invite details');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadContext();

    return () => {
      cancelled = true;
    };
  }, [inviteId, refreshKey]); // Include refreshKey to trigger refetch

  const handleResend = async () => {
    if (!context?.resendEligible) return;

    setResending(true);
    const startTime = performance.now();

    try {
      const result = await resendInviteWithContext(inviteId);
      const elapsed = performance.now() - startTime;

      // Log timing for SLA monitoring
      console.info(`[SLA] Resend completed in ${elapsed.toFixed(0)}ms`);

      setContext((prev) =>
        prev
          ? {
              ...prev,
              reminderCount: result.reminderCount,
              lastSentAt: result.lastSentAt,
              resendEligible: result.resendEligible,
              inviteUrl: result.inviteUrl,
              eligibilityReason: result.resendEligible ? null : `Reminder cap of ${prev.reminderCap} reached`,
            }
          : prev
      );

      showToast(result.message || 'Invite resent successfully', 'success');
      onResendSuccess?.({
        reminderCount: result.reminderCount,
        resendEligible: result.resendEligible,
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to resend invite', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleCopySuccess = () => {
    showToast('Invite link copied to clipboard', 'success');
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInviteResendContext(inviteId);
      setContext(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh invite details');
    } finally {
      setLoading(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="invite-resend-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="resend-modal-title"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2 id="resend-modal-title">Resend Invite</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <RefreshCw size={24} className="spin" />
              <span>Loading invite details…</span>
            </div>
          ) : error ? (
            <div className="modal-error">
              <AlertCircle size={24} />
              <span>{error}</span>
              <button className="btn-secondary" onClick={handleRefresh}>
                Retry
              </button>
            </div>
          ) : context ? (
            <>
              {/* Identity Section */}
              <section className="modal-section">
                <h3>Invitee</h3>
                <div className="invite-identity">
                  <div className="identity-row">
                    <User size={16} />
                    <span className="identity-label">Name</span>
                    <span className="identity-value">{context.fullName || '—'}</span>
                  </div>
                  <div className="identity-row">
                    <Mail size={16} />
                    <span className="identity-label">Email</span>
                    <span className="identity-value">{context.email}</span>
                  </div>
                </div>
              </section>

              {/* Invite Link Section */}
              <section className="modal-section">
                <h3>Invitation Link</h3>
                {context.inviteUrl ? (
                  <CopyableField
                    value={context.inviteUrl}
                    label="Share this link with the invitee"
                    disabled={!context.resendEligible}
                    onCopy={handleCopySuccess}
                  />
                ) : (
                  <p className="invite-url-placeholder">
                    Click "Resend Invite" to generate a new invitation link.
                  </p>
                )}
              </section>

              {/* Reminder Metadata Section */}
              <section className="modal-section">
                <h3>Reminder History</h3>
                <div className="reminder-metadata">
                  <div className="metadata-row">
                    <Clock size={16} />
                    <span className="metadata-label">Last Sent</span>
                    <span className="metadata-value">{formatDate(context.lastSentAt)}</span>
                  </div>
                  <div className="metadata-row">
                    <Send size={16} />
                    <span className="metadata-label">Reminders Sent</span>
                    <span className="metadata-value">
                      {context.reminderCount} / {context.reminderCap}
                    </span>
                  </div>
                  {context.lastSentBy && (
                    <div className="metadata-row">
                      <User size={16} />
                      <span className="metadata-label">Sent By</span>
                      <span className="metadata-value">{context.lastSentBy}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Guardrail Message */}
              {!context.resendEligible && (
                <div className={`guardrail-message guardrail-${context.status.toLowerCase()}`}>
                  {context.status === 'ACCEPTED' ? (
                    <>
                      <CheckCircle size={18} />
                      <div className="guardrail-content">
                        <span className="guardrail-title">Invite Already Accepted</span>
                        <span className="guardrail-detail">
                          This invite was accepted on {formatDate(context.usedAt)}.
                          The user is now an active member.
                        </span>
                      </div>
                    </>
                  ) : context.status === 'REVOKED' ? (
                    <>
                      <Ban size={18} />
                      <div className="guardrail-content">
                        <span className="guardrail-title">Invite Revoked</span>
                        <span className="guardrail-detail">
                          This invite was revoked on {formatDate(context.revokedAt)}.
                          Create a new invite to re-invite this user.
                        </span>
                      </div>
                    </>
                  ) : context.reminderCount >= context.reminderCap ? (
                    <>
                      <AlertCircle size={18} />
                      <div className="guardrail-content">
                        <span className="guardrail-title">Reminder Cap Reached</span>
                        <span className="guardrail-detail">
                          This invite has reached the maximum of {context.reminderCap} reminders.
                          Contact support if additional reminders are needed.
                        </span>
                      </div>
                    </>
                  ) : context.eligibilityReason ? (
                    <>
                      <AlertCircle size={18} />
                      <span>{context.eligibilityReason}</span>
                    </>
                  ) : null}
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleResend}
            disabled={loading || resending || !context?.resendEligible}
          >
            {resending ? (
              <>
                <RefreshCw size={16} className="spin" />
                Sending…
              </>
            ) : (
              <>
                <Send size={16} />
                Resend Invite
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteResendModal;
