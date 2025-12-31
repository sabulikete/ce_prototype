const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

// Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Basic Login Mock for now (Since we are moving from client mock)
// In a real app, this should use bcrypt + JWT as defined in userRoutes, 
// but for MVP transition let's keep it simple or implement full auth.
// Let's implement a simple DB-backed login.
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // 1. Try DB Lookup first
    try {
        const user = await User.findOne({ where: { email } });

        // Simple plaintext password check for MVP
        // In production, use bcrypt.compare(password, user.password_hash)
        if (user && user.password_hash === password && user.status === 'Active') {
            return res.json({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    unit: user.unit
                },
                token: `mock-jwt-${user.id}`
            });
        }
    } catch (err) {
        console.error("Login error:", err);
    }

    // 2. Fallback to Dev Backdoors (Optional, can remove if DB is seeded correctly)
    if (email === 'admin@ce.app' && password === 'admin') {
        return res.json({
            user: { id: 1, name: 'Admin User', email, role: 'ADMIN' },
            token: 'mock-jwt-admin'
        });
    }
    if (email === 'member@ce.app' && password === 'member') {
        return res.json({
            user: { id: 2, name: 'John Doe', email, role: 'MEMBER' },
            token: 'mock-jwt-member'
        });
    }

    res.status(401).json({ message: 'Invalid credentials or inactive account' });
});


// Sync DB & Start
sequelize.sync({ force: false }).then(async () => {
    // Seed basic users if empty
    const count = await User.count();
    if (count === 0) {
        await User.bulkCreate([
            { name: 'Admin User', email: 'admin@ce.app', role: 'ADMIN', status: 'Active' },
            { name: 'John Doe', email: 'member@ce.app', role: 'MEMBER', status: 'Active', unit: '3C-201' }
        ]);
        console.log('Use Seeded');
    }
    console.log('Database synced');
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
