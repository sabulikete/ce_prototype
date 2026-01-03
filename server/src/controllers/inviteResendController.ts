import { Request, Response } from 'express';
import { resendInviteById, InviteActionError } from '../services/inviteService';

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
    return res.json({
      id: invite.id,
      status: invite.status,
      reminderCount: invite.reminder_count,
      expiresAt: invite.expires_at,
      lastSentAt: invite.last_sent_at,
    });
  } catch (error) {
    if (error instanceof InviteActionError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Failed to resend invite', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
