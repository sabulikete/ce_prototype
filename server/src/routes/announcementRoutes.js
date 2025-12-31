const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// GET /api/announcements
router.get('/', async (req, res) => {
    try {
        const { visibility } = req.query;
        const where = {};
        if (visibility === 'PUBLIC') {
            where.visibility = 'PUBLIC';
        }

        const posts = await Announcement.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/announcements
router.post('/', async (req, res) => {
    try {
        const post = await Announcement.create(req.body);
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/announcements/:id
router.delete('/:id', async (req, res) => {
    try {
        await Announcement.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
