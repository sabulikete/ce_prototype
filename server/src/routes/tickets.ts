import { Router } from 'express';
import * as ticketController from '../controllers/ticketController';
import { authenticate, requireRole, requireAuth } from '../middleware/auth';
import { checkInLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/admin/events/:id/tickets', authenticate, requireRole(['ADMIN']), ticketController.issueTickets);
router.get('/admin/events/:id/tickets', authenticate, requireRole(['ADMIN']), ticketController.getEventAttendees);
router.get('/tickets/my-tickets', authenticate, requireAuth, ticketController.getMyTickets);
router.post('/staff/check-in', authenticate, requireRole(['STAFF', 'ADMIN']), checkInLimiter, ticketController.checkIn);

export default router;
