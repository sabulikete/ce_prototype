import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimit';
import { getInviteResendContext, resendInvite } from '../controllers/inviteResendController';
import { revokeInvite } from '../controllers/inviteRevokeController';

const router = Router();

router.get('/admin/invites/:inviteId/resend-context', authenticate, requireRole(['ADMIN']), getInviteResendContext);
router.post('/admin/invites/:inviteId/resend', authenticate, requireRole(['ADMIN']), apiLimiter, resendInvite);
router.patch('/admin/invites/:inviteId/revoke', authenticate, requireRole(['ADMIN']), apiLimiter, revokeInvite);

export default router;
