import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import contentRoutes from './routes/content';
import ticketRoutes from './routes/tickets';
import billingRoutes from './routes/billing';
import userRoutes from './routes/users';
import eventRoutes from './routes/eventRoutes';
import adminInviteRoutes from './routes/adminInvites';
import { requestLogger } from './middleware/logging';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', authRoutes);
app.use('/api', contentRoutes);
app.use('/api', ticketRoutes);
app.use('/api', billingRoutes);
app.use('/api', userRoutes);
app.use('/api', eventRoutes);
app.use('/api', adminInviteRoutes);

export default app;
