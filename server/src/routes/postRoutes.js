const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { Op } = require('sequelize');

// GET /api/posts - List posts with filtering
router.get('/', async (req, res) => {
    try {
        const { type, visibility, status, upcoming } = req.query;
        const where = {};

        // Filter by type (announcement, event, memo)
        if (type) where.type = type;

        // Filter by visibility (public, member)
        if (visibility) where.visibility = visibility;

        // Filter by status (default to published for non-admin)
        if (status) {
            where.status = status;
        } else {
            where.status = 'published'; // Default: only show published
        }

        // Filter upcoming events
        if (upcoming === 'true' && type === 'event') {
            where.event_start_at = { [Op.gte]: new Date() };
        }

        const posts = await Post.findAll({
            where,
            order: [
                ['is_pinned', 'DESC'],
                ['created_at', 'DESC']
            ]
        });

        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/posts/:id - Get single post
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/posts - Create post
router.post('/', async (req, res) => {
    try {
        // Validation for events
        if (req.body.type === 'event') {
            if (!req.body.event_start_at) {
                return res.status(400).json({ message: 'Events require event_start_at' });
            }
            if (req.body.event_end_at && new Date(req.body.event_end_at) < new Date(req.body.event_start_at)) {
                return res.status(400).json({ message: 'event_end_at must be >= event_start_at' });
            }
        }

        const post = await Post.create(req.body);
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/posts/:id - Update post
router.patch('/:id', async (req, res) => {
    try {
        const post = await Post.findByPk(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        await post.update(req.body);
        res.json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/posts/:id
router.delete('/:id', async (req, res) => {
    try {
        await Post.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
