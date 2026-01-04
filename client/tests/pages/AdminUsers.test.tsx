import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock the API module
vi.mock('../../src/services/api', () => ({
  fetchAdminUserRows: vi.fn(),
  createInvite: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  resendInvite: vi.fn(),
  revokeInvite: vi.fn(),
  getErrorMessage: vi.fn((err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback
  ),
}));

// Mock ToastContext
vi.mock('../../src/context/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Import after mocking
import AdminUsers from '../../src/pages/Admin/AdminUsers';
import * as api from '../../src/services/api';

const mockInviteRow = (overrides = {}) => ({
  id: 1,
  source: 'INVITE' as const,
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'MEMBER' as const,
  status: 'PENDING',
  joinedAt: null,
  lastLogin: null,
  invitation: {
    sentAt: '2026-01-01T00:00:00Z',
    lastSentAt: '2026-01-02T00:00:00Z',
    expiresAt: '2026-01-15T00:00:00Z',
    reminderCount: 1,
    status: 'PENDING' as const,
    inviter: { id: 1, name: 'Admin', role: 'ADMIN' as const },
    revokedAt: null,
    conflictFlags: [],
    permissions: {
      canResend: true,
      canRevoke: true,
      maxReminders: 3,
      resendEligible: true,
      eligibilityReason: null,
    },
  },
  ...overrides,
});

const mockCapReachedRow = () =>
  mockInviteRow({
    id: 2,
    email: 'capped@example.com',
    invitation: {
      sentAt: '2026-01-01T00:00:00Z',
      lastSentAt: '2026-01-04T00:00:00Z',
      expiresAt: '2026-01-15T00:00:00Z',
      reminderCount: 3,
      status: 'PENDING' as const,
      inviter: { id: 1, name: 'Admin', role: 'ADMIN' as const },
      revokedAt: null,
      conflictFlags: [],
      permissions: {
        canResend: false,
        canRevoke: true,
        maxReminders: 3,
        resendEligible: false,
        eligibilityReason: 'Reminder cap of 3 reached',
      },
    },
  });

const mockRevokedRow = () =>
  mockInviteRow({
    id: 3,
    email: 'revoked@example.com',
    status: 'REVOKED',
    invitation: {
      sentAt: '2026-01-01T00:00:00Z',
      lastSentAt: '2026-01-02T00:00:00Z',
      expiresAt: '2026-01-15T00:00:00Z',
      reminderCount: 0,
      status: 'REVOKED' as const,
      inviter: { id: 1, name: 'Admin', role: 'ADMIN' as const },
      revokedAt: '2026-01-03T00:00:00Z',
      conflictFlags: [],
      permissions: {
        canResend: false,
        canRevoke: false,
        maxReminders: 3,
        resendEligible: false,
        eligibilityReason: 'Invite has been revoked',
      },
    },
  });

describe('AdminUsers - Invited Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders full name and email columns for invite rows', async () => {
    vi.mocked(api.fetchAdminUserRows).mockResolvedValue({
      data: [mockInviteRow()],
      pagination: { page: 1, pageSize: 25, total: 1 },
    });

    render(<AdminUsers />);

    // Wait for loading to complete
    expect(await screen.findByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows Resend button as enabled for eligible invites', async () => {
    vi.mocked(api.fetchAdminUserRows).mockResolvedValue({
      data: [mockInviteRow()],
      pagination: { page: 1, pageSize: 25, total: 1 },
    });

    render(<AdminUsers />);

    const resendBtn = await screen.findByRole('button', { name: /resend/i });
    expect(resendBtn).not.toBeDisabled();
    expect(resendBtn).toHaveAttribute('title', 'Resend invite');
  });

  it('disables Resend button when reminder cap is reached', async () => {
    vi.mocked(api.fetchAdminUserRows).mockResolvedValue({
      data: [mockCapReachedRow()],
      pagination: { page: 1, pageSize: 25, total: 1 },
    });

    render(<AdminUsers />);

    const resendBtn = await screen.findByRole('button', { name: /resend/i });
    expect(resendBtn).toBeDisabled();
    expect(resendBtn).toHaveAttribute('title', 'Reminder cap of 3 reached');
  });

  it('disables Resend button for revoked invites with reason tooltip', async () => {
    vi.mocked(api.fetchAdminUserRows).mockResolvedValue({
      data: [mockRevokedRow()],
      pagination: { page: 1, pageSize: 25, total: 1 },
    });

    render(<AdminUsers />);

    const resendBtn = await screen.findByRole('button', { name: /resend/i });
    expect(resendBtn).toBeDisabled();
    expect(resendBtn).toHaveAttribute('title', 'Invite has been revoked');
  });

  it('displays reminder count with max reminders', async () => {
    vi.mocked(api.fetchAdminUserRows).mockResolvedValue({
      data: [mockInviteRow()],
      pagination: { page: 1, pageSize: 25, total: 1 },
    });

    render(<AdminUsers />);

    // Wait for data to load and check reminder display
    await screen.findByText('Test User');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('shows empty state with eligibility message when no invites exist', async () => {
    vi.mocked(api.fetchAdminUserRows).mockResolvedValue({
      data: [],
      pagination: { page: 1, pageSize: 25, total: 0 },
    });

    render(<AdminUsers />);

    const emptyMessage = await screen.findByText(/No pending invites found/i);
    expect(emptyMessage).toBeInTheDocument();
    expect(emptyMessage).toHaveTextContent(/Resend button appears for invites/i);
  });

  it('calls resendInvite API when Resend button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchAdminUserRows).mockResolvedValue({
      data: [mockInviteRow()],
      pagination: { page: 1, pageSize: 25, total: 1 },
    });
    vi.mocked(api.resendInvite).mockResolvedValue({ id: 1, status: 'PENDING' });

    render(<AdminUsers />);

    const resendBtn = await screen.findByRole('button', { name: /resend/i });
    await user.click(resendBtn);

    expect(api.resendInvite).toHaveBeenCalledWith(1);
  });

  it('renders multiple rows with mixed eligibility states correctly', async () => {
    vi.mocked(api.fetchAdminUserRows).mockResolvedValue({
      data: [mockInviteRow(), mockCapReachedRow(), mockRevokedRow()],
      pagination: { page: 1, pageSize: 25, total: 3 },
    });

    render(<AdminUsers />);

    // Wait for rows to render
    await screen.findByText('Test User');

    const rows = screen.getAllByRole('row');
    // Header row + 3 data rows
    expect(rows).toHaveLength(4);

    // First row - eligible
    const firstRowResend = within(rows[1]).getByRole('button', { name: /resend/i });
    expect(firstRowResend).not.toBeDisabled();

    // Second row - cap reached
    const secondRowResend = within(rows[2]).getByRole('button', { name: /resend/i });
    expect(secondRowResend).toBeDisabled();

    // Third row - revoked
    const thirdRowResend = within(rows[3]).getByRole('button', { name: /resend/i });
    expect(thirdRowResend).toBeDisabled();
  });
});
