import { Request, Response } from 'express';
import { resendInviteById, getResendContext, InviteActionError } from '../services/inviteService';

/**
 * GET /api/admin/invites/:inviteId/resend-context
 * Returns metadata for the Resend Invite modal including eligibility and invite URL.
 */
export const getInviteResendContext = async (req: Request, res: Response) => {
  const inviteId = Number(req.params.inviteId);
  if (Number.isNaN(inviteId)) {
    return res.status(400).json({ error: 'Invalid invite id' });
  }
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const context = await getResendContext(inviteId);
    // Note: We cannot provide an invite URL here as we only store the token hash.
    // The invite URL will be generated and returned when the invite is resent.
    return res.json({
      ...context,
      inviteUrl: null,
      channels: ['email'],
    });
  } catch (error) {
    if (error instanceof InviteActionError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Failed to get resend context', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const resendInvite = async (req: Request, res: Response) => {
  const inviteId = Number(req.params.inviteId);
  if (Number.isNaN(inviteId)) {
    return res.status(400).json({ error: 'Invalid invite id' });
  }
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const invite = await resendInviteById(inviteId, req.user.id);
    const inviteUrl = `${process.env.APP_URL || 'http://localhost:5173'}/accept-invite?token=${invite.token}`;
    return res.json({
      inviteId: invite.id,
      status: invite.status,
      reminderCount: invite.reminder_count,
      lastSentAt: invite.last_sent_at,
      channels: ['email'],
      resendEligible: invite.resendEligible,
      inviteUrl,
      message: 'Invite resent successfully',
    });
  } catch (error) {
    if (error instanceof InviteActionError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Failed to resend invite', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
