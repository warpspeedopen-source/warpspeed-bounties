import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import threadRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mock auth middleware (production should use real auth)
app.use((req: any, _res, next) => {
  req.user = { id: req.headers['x-user-id'] || 'demo-user' };
  next();
});

// Routes
app.use('/api/threads', threadRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Email Threads API running on port ${PORT}`);
  });
}

export default app;
