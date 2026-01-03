import { Request, Response } from 'express';
import { revokeInviteById, InviteActionError } from '../services/inviteService';

export const revokeInvite = async (req: Request, res: Response) => {
  const inviteId = Number(req.params.inviteId);
  if (Number.isNaN(inviteId)) {
    return res.status(400).json({ error: 'Invalid invite id' });
  }
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : undefined;

  try {
    const invite = await revokeInviteById(inviteId, req.user.id, reason);
    return res.json({
      id: invite.id,
      status: invite.status,
      revokedAt: invite.revoked_at,
    });
  } catch (error) {
    if (error instanceof InviteActionError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Failed to revoke invite', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
