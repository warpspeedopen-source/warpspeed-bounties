import express from 'express';
import cors from 'cors';
import threadRoutes from './routes/threads.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', threadRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Email Threads API running on http://localhost:${PORT}`);
});

export default app;
