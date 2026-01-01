import { Router } from 'express';
import * as contentController from '../controllers/contentController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public/Member
router.get('/content', authenticate, contentController.listContent); // authenticate handles guest too
router.get('/content/:id', authenticate, contentController.getContent);
router.get('/events', authenticate, contentController.listEvents);

// Admin
router.post('/admin/content', authenticate, requireRole(['ADMIN']), contentController.createContent);
router.put('/admin/content/:id', authenticate, requireRole(['ADMIN']), contentController.updateContent);
router.delete('/admin/content/:id', authenticate, requireRole(['ADMIN']), contentController.deleteContent);
router.patch('/admin/content/:id/status', authenticate, requireRole(['ADMIN']), contentController.updateStatus);
router.patch('/admin/content/:id/pin', authenticate, requireRole(['ADMIN']), contentController.pinContent);

export default router;
