import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimit';
import { resendInvite } from '../controllers/inviteResendController';
import { revokeInvite } from '../controllers/inviteRevokeController';

const router = Router();

router.post('/admin/invites/:inviteId/resend', authenticate, requireRole(['ADMIN']), apiLimiter, resendInvite);
router.patch('/admin/invites/:inviteId/revoke', authenticate, requireRole(['ADMIN']), apiLimiter, revokeInvite);

export default router;
