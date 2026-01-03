import { Router } from 'express';
import * as eventController from '../controllers/eventController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Dashboard endpoints (protected for admins only)
router.get('/admin/events/metrics', authenticate, requireRole(['ADMIN']), eventController.getDashboardMetrics);
router.get('/admin/events', authenticate, requireRole(['ADMIN']), eventController.getEvents);

// Event detail endpoints (protected for admins only)
router.get('/events/:eventId', authenticate, requireRole(['ADMIN']), eventController.getEventDetail);
router.get('/events/:eventId/attendees', authenticate, requireRole(['ADMIN']), eventController.getEventAttendees);

export default router;
