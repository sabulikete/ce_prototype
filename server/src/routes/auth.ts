import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate, requireRole } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/auth/login', loginLimiter, authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// Invites
router.post('/admin/invites', authenticate, requireRole(['ADMIN']), authController.createInvite);
router.get('/invites/:token', authController.validateInvite);
router.post('/invites/:token/accept', authController.acceptInvite);

export default router;
