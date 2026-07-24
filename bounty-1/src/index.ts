import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { createChildLogger } from './utils/logger';
import { SQSConsumer } from './consumers/sqsConsumer';
import { processAttachment } from './orchestrator';
import { checkOllamaHealth } from './summarizers/ollamaSummarizer';
import type { HealthCheckResponse } from './models/types';

const log = createChildLogger('server');
const prisma = new PrismaClient();

const PORT = parseInt(process.env.PORT || '3000', 10);
const START_TIME = Date.now();
const VERSION = '1.0.0';

// ── Express App ──────────────────────────────────────────────
const app = express();

app.use(helmet());
app.use(morgan('short'));
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────

/** Health check endpoint */
app.get('/health', async (_req, res) => {
  const checks: HealthCheckResponse['checks'] = {
    sqs: false,
    gcs: false,
    ollama: false,
    redis: false,
    database: false,
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  // Check Ollama
  checks.ollama = await checkOllamaHealth();

  // SQS health (lazy check)
  checks.sqs = !!process.env.SQS_QUEUE_URL;

  const allHealthy = Object.values(checks).every(Boolean);
  const status = allHealthy
    ? 'healthy'
    : checks.database
      ? 'degraded'
      : 'unhealthy';

  const response: HealthCheckResponse = {
    status,
    version: VERSION,
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    checks,
  };

  res.status(status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503).json(response);
});

/** Get processing stats */
app.get('/stats', async (_req, res) => {
  try {
    const [total, completed, failed, pending] = await Promise.all([
      prisma.attachment.count(),
      prisma.attachment.count({ where: { status: 'COMPLETED' } }),
      prisma.attachment.count({ where: { status: 'FAILED' } }),
      prisma.attachment.count({ where: { status: 'PENDING' } }),
    ]);

    res.json({
      total,
      completed,
      failed,
      pending,
      errorRate: total > 0 ? ((failed / total) * 100).toFixed(1) + '%' : '0%',
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/** Get a specific attachment's processing details */
app.get('/attachments/:eventId', async (req, res) => {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { eventId: req.params.eventId },
      include: {
        extraction: true,
        summary: true,
        processingLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    res.json(attachment);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ── Start ────────────────────────────────────────────────────

export async function start(): Promise<void> {
  // Connect to database
  await prisma.$connect();
  log.info('Database connected');

  // Start HTTP server
  app.listen(PORT, () => {
    log.info(`Server listening on port ${PORT}`);
  });

  // Start SQS consumer (if configured)
  if (process.env.SQS_QUEUE_URL) {
    const consumer = new SQSConsumer(processAttachment);
    consumer.start();
    log.info('SQS consumer started');

    // Graceful shutdown
    const shutdown = () => {
      log.info('Shutting down...');
      consumer.stop();
      prisma.$disconnect();
      process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } else {
    log.warn('No SQS_QUEUE_URL configured — server running in health-check-only mode');
  }
}

// ── Main ─────────────────────────────────────────────────────

if (require.main === module) {
  start().catch((err) => {
    log.error('Failed to start', { error: err.message });
    process.exit(1);
  });
}

export { app };
