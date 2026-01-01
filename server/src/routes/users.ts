import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/users', authenticate, requireRole(['ADMIN']), userController.listUsers);
router.patch('/users/:id', authenticate, requireRole(['ADMIN']), userController.updateUser);
router.delete('/users/:id', authenticate, requireRole(['ADMIN']), userController.deleteUser);

export default router;
