import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate, requireRole } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimit';

const router = Router();

// Admin-specific routes (preferred)
router.get('/admin/users', authenticate, requireRole(['ADMIN']), apiLimiter, userController.listAdminUsers);
router.get('/admin/users/selectable', authenticate, requireRole(['ADMIN']), apiLimiter, userController.getSelectableUsers);
router.patch('/admin/users/:id', authenticate, requireRole(['ADMIN']), apiLimiter, userController.updateUser);
router.delete('/admin/users/:id', authenticate, requireRole(['ADMIN']), apiLimiter, userController.deleteUser);

// Legacy routes (to be removed once client migrates to /admin/users)
router.get('/users', authenticate, requireRole(['ADMIN']), apiLimiter, userController.listUsers);
router.get('/users/selectable', authenticate, requireRole(['ADMIN']), apiLimiter, userController.getSelectableUsers);
router.patch('/users/:id', authenticate, requireRole(['ADMIN']), apiLimiter, userController.updateUser);
router.delete('/users/:id', authenticate, requireRole(['ADMIN']), apiLimiter, userController.deleteUser);

export default router;
