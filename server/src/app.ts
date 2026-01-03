import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import contentRoutes from './routes/content';
import ticketRoutes from './routes/tickets';
import billingRoutes from './routes/billing';
import userRoutes from './routes/users';
import eventRoutes from './routes/eventRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      requestId: req.headers['x-request-id'] || 'unknown',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    }));
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', authRoutes);
app.use('/api', contentRoutes);
app.use('/api', ticketRoutes);
app.use('/api', billingRoutes);
app.use('/api', userRoutes);
app.use('/api', eventRoutes);

export default app;
