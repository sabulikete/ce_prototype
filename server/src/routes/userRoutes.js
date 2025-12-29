const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');

// GET /api/users - List all users
router.get('/', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'status', 'unit', 'invite_token']
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/invite - Invite a user
router.post('/invite', async (req, res) => {
    try {
        const { email, role, name, unit } = req.body;

        // Check if exists
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // Generate random token
        const token = crypto.randomBytes(32).toString('hex');

        const newUser = await User.create({
            email,
            role,
            name,
            unit,
            status: 'Invited',
            invite_token: token
        });

        // In a real app, send email here.
        // For now, return the token/link so the admin can see it.

        res.json({ ...newUser.toJSON(), invite_link: `/accept-invite?token=${token}` });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/activate - Activate account
router.post('/activate', async (req, res) => {
    try {
        const { token, password } = req.body;

        const user = await User.findOne({ where: { invite_token: token } });

        if (!user) {
            return res.status(404).json({ message: 'Invalid or expired invite token.' });
        }

        // Simulating password hash for MVP (Use bcrypt in production)
        // user.password_hash = await bcrypt.hash(password, 10);
        user.password_hash = password; // MVP only
        user.status = 'Active';
        user.invite_token = null; // Clear token (single use)
        await user.save();

        res.json({ success: true, message: 'Account activated' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id - Delete a user
router.delete('/:id', async (req, res) => {
    try {
        await User.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
