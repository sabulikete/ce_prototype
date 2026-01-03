import { Router } from 'express';
import * as eventController from '../controllers/eventController';
import { authenticate, requireRole } from '../middleware/auth';

const Event = require('../models/Event');
const { Op } = require('sequelize');

const router = Router();

// Dashboard endpoints (protected for admins only)
router.get('/events/admin/dashboard/metrics', authenticate, requireRole(['ADMIN']), eventController.getDashboardMetrics);
router.get('/events/admin/dashboard/events', authenticate, requireRole(['ADMIN']), eventController.getEvents);

// GET /api/events - List events (supporting filter)
router.get('/', async (req, res) => {
    try {
        const { visibility } = req.query;
        const where: any = {};
        if (visibility === 'PUBLIC') {
            where.visibility = 'PUBLIC';
        }
        // If not filtered (e.g. admin or member), returns all by default if no logic added, 
        // or we can enforce role checks middleware later. 
        // For MVP: Members/Admins see all, Public sees only PUBLIC. 
        // The frontend should ask for the right thing or backend enforces.
        // Let's rely on query param for now.

        const events = await Event.findAll({ where, order: [['date', 'ASC']] });
        res.json(events);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/events - Create event
router.post('/', async (req, res) => {
    try {
        const event = await Event.create(req.body);
        res.json(event);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/events/:id
router.delete('/:id', async (req, res) => {
    try {
        await Event.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
