import React, { useState, useEffect } from 'react';
import Select, { MultiValue } from 'react-select';
import { X } from 'lucide-react';
import { getSelectableUsers, issueTickets, getErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface UserOption {
  value: number;
  label: string;
  email: string;
  status: string;
}

interface IssueTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
  status: string;
}

const MAX_TICKETS_PER_USER = 50;

const IssueTicketsModal: React.FC<IssueTicketsModalProps> = ({ isOpen, onClose, eventId }) => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<MultiValue<UserOption>>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSelectableUsers();
      const options: UserOption[] = response.users.map((user: UserResponse) => ({
        value: user.id,
        label: user.name,
        email: user.email,
        status: user.status
      }));
      setUsers(options);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setSubmitting(true);
      const userIds = selectedUsers.map(user => user.value);
      const result = await issueTickets(eventId, userIds, quantity);
      
      // Check for partial fulfillment or cap reached
      const failedUsers = result.results.filter(r => r.error || r.issuedCount === 0);
      const partialUsers = result.results.filter(r => r.capReached && r.issuedCount > 0);
      
      if (failedUsers.length > 0) {
        showToast(
          `Issued ${result.totalIssued} tickets. ${failedUsers.length} user(s) failed.`,
          'warning'
        );
      } else if (partialUsers.length > 0) {
        showToast(
          `Issued ${result.totalIssued} tickets (some users hit capacity limit)`,
          'warning'
        );
      } else {
        showToast(`Successfully issued ${result.totalIssued} tickets`, 'success');
      }
      
      setSelectedUsers([]);
      setQuantity(1);
      onClose();
    } catch (err: unknown) {
      showToast(getErrorMessage(err, 'Failed to issue tickets'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setSelectedUsers([]);
      setQuantity(1);
      setError(null);
      onClose();
    }
  };

  const formatOptionLabel = (option: UserOption) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontWeight: 500 }}>{option.label}</div>
        <div style={{ fontSize: '0.85em', color: '#666' }}>{option.email}</div>
      </div>
      <span 
        style={{ 
          fontSize: '0.75em',
          padding: '2px 6px',
          borderRadius: '3px',
          backgroundColor: option.status === 'ACTIVE' ? '#e8f5e9' : '#fff3e0',
          color: option.status === 'ACTIVE' ? '#2e7d32' : '#ef6c00'
        }}
      >
        {option.status === 'ACTIVE' ? 'Active' : 'Invited'}
      </span>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Issue Tickets</h2>
          <button 
            onClick={handleClose} 
            className="modal-close-btn"
            disabled={submitting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error ? (
            <div className="error-alert">
              <p>{error}</p>
              <button onClick={loadUsers} className="retry-btn-small">
                Retry
              </button>
            </div>
          ) : (
            <>
              <p className="modal-description">
                Select users to issue tickets. You can select multiple users at once.
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <label 
                  htmlFor="ticket-quantity" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: 500,
                    fontSize: '0.9em'
                  }}
                >
                  Tickets per user
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    id="ticket-quantity"
                    type="number"
                    min={1}
                    max={MAX_TICKETS_PER_USER}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(MAX_TICKETS_PER_USER, Math.max(1, parseInt(e.target.value) || 1)))}
                    disabled={submitting}
                    style={{
                      width: '80px',
                      padding: '8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                    aria-describedby="quantity-help"
                  />
                  <span id="quantity-help" style={{ fontSize: '0.85em', color: '#666' }}>
                    Max {MAX_TICKETS_PER_USER} per user
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9em' }}>
                  Select users
                </label>
              </div>
              
              <Select
                isMulti
                options={users}
                value={selectedUsers}
                onChange={setSelectedUsers}
                formatOptionLabel={formatOptionLabel}
                closeMenuOnSelect={false}
                isLoading={loading}
                isDisabled={submitting}
                placeholder={loading ? "Loading users..." : "Search and select users"}
                noOptionsMessage={() => "No users available"}
                className="react-select-container"
                classNamePrefix="react-select"
                aria-label="Select users for ticket issuance"
                aria-busy={loading}
              />
              <span
                role="status"
                aria-live="polite"
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: 0,
                }}
              >
                {selectedUsers.length === 0
                  ? 'No users selected.'
                  : `${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''} selected.`}
              </span>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button 
            onClick={handleClose} 
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="btn-primary"
            disabled={selectedUsers.length === 0 || submitting || loading}
          >
            {submitting 
              ? 'Issuing Tickets...' 
              : `Issue ${selectedUsers.length * quantity} Ticket${selectedUsers.length * quantity !== 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueTicketsModal;
