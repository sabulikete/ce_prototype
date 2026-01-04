import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import InviteResendModal from '../../src/components/Admin/InviteResendModal';
import * as api from '../../src/services/api';
import { ToastProvider } from '../../src/context/ToastContext';

// Mock the API module
vi.mock('../../src/services/api', () => ({
  fetchInviteResendContext: vi.fn(),
  resendInviteWithContext: vi.fn(),
}));

// Mock clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

const mockFetchContext = vi.mocked(api.fetchInviteResendContext);
const mockResend = vi.mocked(api.resendInviteWithContext);

const renderModal = (props = {}) => {
  const defaultProps = {
    inviteId: 1,
    onClose: vi.fn(),
    onResendSuccess: vi.fn(),
    ...props,
  };

  return render(
    <ToastProvider>
      <InviteResendModal {...defaultProps} />
    </ToastProvider>
  );
};

const createMockContext = (
  overrides: Partial<api.ResendContextResponse> = {}
): api.ResendContextResponse => ({
  inviteId: 1,
  email: 'test@example.com',
  fullName: 'Test User',
  status: 'PENDING',
  reminderCount: 1,
  reminderCap: 3,
  lastSentAt: '2024-01-01T12:00:00Z',
  lastSentBy: 'admin@example.com',
  channels: ['email'],
  resendEligible: true,
  eligibilityReason: null,
  inviteUrl: 'https://app.example.com/accept-invite?token=abc123',
  usedAt: null,
  revokedAt: null,
  expiresAt: '2024-01-15T12:00:00Z',
  ...overrides,
});

describe('InviteResendModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchContext.mockResolvedValue(createMockContext());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────
  // Loading and Error States
  // ──────────────────────────────────────────────────────────────────────

  it('shows loading state while fetching context', () => {
    mockFetchContext.mockReturnValue(new Promise(() => {})); // Never resolves
    renderModal();

    expect(screen.getByText(/loading invite details/i)).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    mockFetchContext.mockRejectedValue(new Error('Network error'));
    renderModal();

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Eligible Invite (PENDING with reminders available)
  // ──────────────────────────────────────────────────────────────────────

  it('displays invite details for eligible invite', async () => {
    renderModal();

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });

  it('enables resend button for eligible invite', async () => {
    renderModal();

    await waitFor(() => {
      const resendBtn = screen.getByRole('button', { name: /resend invite/i });
      expect(resendBtn).not.toBeDisabled();
    });
  });

  it('enables copy field for eligible invite', async () => {
    renderModal();

    await waitFor(() => {
      const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
      expect(copyBtn).not.toBeDisabled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // ACCEPTED Invite (Already used)
  // ──────────────────────────────────────────────────────────────────────

  it('shows accepted guardrail message for ACCEPTED invite', async () => {
    mockFetchContext.mockResolvedValue(
      createMockContext({
        status: 'ACCEPTED',
        resendEligible: false,
        eligibilityReason: 'Invite has already been accepted',
        usedAt: '2024-01-05T10:30:00Z',
      })
    );

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Invite Already Accepted')).toBeInTheDocument();
      expect(
        screen.getByText(/this invite was accepted on/i)
      ).toBeInTheDocument();
    });
  });

  it('disables resend button for ACCEPTED invite', async () => {
    mockFetchContext.mockResolvedValue(
      createMockContext({
        status: 'ACCEPTED',
        resendEligible: false,
        eligibilityReason: 'Invite has already been accepted',
      })
    );

    renderModal();

    await waitFor(() => {
      const resendBtn = screen.getByRole('button', { name: /resend invite/i });
      expect(resendBtn).toBeDisabled();
    });
  });

  it('disables copy field for ACCEPTED invite', async () => {
    mockFetchContext.mockResolvedValue(
      createMockContext({
        status: 'ACCEPTED',
        resendEligible: false,
      })
    );

    renderModal();

    await waitFor(() => {
      const copyBtn = screen.getByRole('button', { name: /copy to clipboard/i });
      expect(copyBtn).toBeDisabled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // REVOKED Invite
  // ──────────────────────────────────────────────────────────────────────

  it('shows revoked guardrail message for REVOKED invite', async () => {
    mockFetchContext.mockResolvedValue(
      createMockContext({
        status: 'REVOKED',
        resendEligible: false,
        eligibilityReason: 'Invite has been revoked',
        revokedAt: '2024-01-03T15:00:00Z',
      })
    );

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Invite Revoked')).toBeInTheDocument();
      expect(
        screen.getByText(/this invite was revoked on/i)
      ).toBeInTheDocument();
    });
  });

  it('disables resend button for REVOKED invite', async () => {
    mockFetchContext.mockResolvedValue(
      createMockContext({
        status: 'REVOKED',
        resendEligible: false,
      })
    );

    renderModal();

    await waitFor(() => {
      const resendBtn = screen.getByRole('button', { name: /resend invite/i });
      expect(resendBtn).toBeDisabled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Over-Cap Invite (Reminder limit reached)
  // ──────────────────────────────────────────────────────────────────────

  it('shows cap-reached guardrail message when reminder cap is reached', async () => {
    mockFetchContext.mockResolvedValue(
      createMockContext({
        reminderCount: 3,
        reminderCap: 3,
        resendEligible: false,
        eligibilityReason: 'Reminder cap of 3 reached',
      })
    );

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Reminder Cap Reached')).toBeInTheDocument();
      expect(
        screen.getByText(/maximum of 3 reminders/i)
      ).toBeInTheDocument();
    });
  });

  it('disables resend button when cap is reached', async () => {
    mockFetchContext.mockResolvedValue(
      createMockContext({
        reminderCount: 3,
        reminderCap: 3,
        resendEligible: false,
      })
    );

    renderModal();

    await waitFor(() => {
      const resendBtn = screen.getByRole('button', { name: /resend invite/i });
      expect(resendBtn).toBeDisabled();
    });
  });

  it('displays reminder count at cap value', async () => {
    mockFetchContext.mockResolvedValue(
      createMockContext({
        reminderCount: 3,
        reminderCap: 3,
        resendEligible: false,
      })
    );

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Resend Action
  // ──────────────────────────────────────────────────────────────────────

  it('calls resend API and updates state on success', async () => {
    const user = userEvent.setup();
    const onResendSuccess = vi.fn();

    mockResend.mockResolvedValue({
      inviteId: 1,
      reminderCount: 2,
      lastSentAt: '2024-01-02T12:00:00Z',
      channels: ['email'],
      resendEligible: true,
      message: 'Invite resent successfully',
    });

    renderModal({ onResendSuccess });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /resend invite/i })).toBeInTheDocument();
    });

    const resendBtn = screen.getByRole('button', { name: /resend invite/i });
    await user.click(resendBtn);

    await waitFor(() => {
      expect(mockResend).toHaveBeenCalledWith(1);
      expect(onResendSuccess).toHaveBeenCalledWith({
        reminderCount: 2,
        resendEligible: true,
      });
    });
  });

  it('updates modal state after resend when cap is reached', async () => {
    const user = userEvent.setup();

    mockResend.mockResolvedValue({
      inviteId: 1,
      reminderCount: 3,
      lastSentAt: '2024-01-02T12:00:00Z',
      channels: ['email'],
      resendEligible: false,
      message: 'Invite resent successfully',
    });

    renderModal();

    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    const resendBtn = screen.getByRole('button', { name: /resend invite/i });
    await user.click(resendBtn);

    await waitFor(() => {
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Modal Interactions
  // ──────────────────────────────────────────────────────────────────────

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderModal({ onClose });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole('button', { name: /close modal/i });
    await user.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderModal({ onClose });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderModal({ onClose });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────────
  // Refresh Functionality
  // ──────────────────────────────────────────────────────────────────────

  it('shows retry button when fetch fails', async () => {
    mockFetchContext.mockRejectedValue(new Error('Network error'));
    renderModal();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('refetches context when retry button is clicked', async () => {
    const user = userEvent.setup();

    // First call fails, second succeeds
    mockFetchContext
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(createMockContext());

    renderModal();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    expect(mockFetchContext).toHaveBeenCalledTimes(2);
  });
});
