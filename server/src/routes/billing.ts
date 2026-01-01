import { Router } from 'express';
import * as billingController from '../controllers/billingController';
import { authenticate, requireRole, requireAuth } from '../middleware/auth';
import multer from 'multer';

const upload = multer(); // Memory storage
const router = Router();

router.get('/billing/my-statements', authenticate, requireAuth, billingController.getMyStatements);
router.get('/billing/download/:id', authenticate, requireAuth, billingController.downloadStatement);

router.post('/admin/billing/upload', authenticate, requireRole(['ADMIN']), upload.single('file'), billingController.uploadStatement);
router.get('/admin/billing/statements', authenticate, requireRole(['ADMIN']), billingController.getAllStatements);

export default router;
