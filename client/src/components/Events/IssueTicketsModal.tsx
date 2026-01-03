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

const IssueTicketsModal: React.FC<IssueTicketsModalProps> = ({ isOpen, onClose, eventId }) => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<MultiValue<UserOption>>([]);
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
      await issueTickets(eventId, userIds);
      showToast('Tickets issued successfully', 'success');
      setSelectedUsers([]);
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
                aria-live="polite"
              />
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
            {submitting ? 'Issuing Tickets...' : `Issue Tickets (${selectedUsers.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueTicketsModal;
