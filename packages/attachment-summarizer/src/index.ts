import { loadConfig } from './lib/config';
import { AttachmentSummarizerOrchestrator } from './services/orchestrator';
import logger from './lib/logger';

/**
 * Attachment Summarizer Service entry point.
 *
 * Consumes attachment events from SQS, downloads from GCS,
 * extracts content, and generates LLM summaries.
 */
async function main(): Promise<void> {
  const config = loadConfig();

  // Validate required config
  if (!config.aws.sqsQueueUrl) {
    logger.error('SQS_QUEUE_URL environment variable is required');
    process.exit(1);
  }

  if (!config.database.url) {
    logger.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  logger.info({
    sqsQueueUrl: config.aws.sqsQueueUrl,
    ollamaModel: config.ollama.model,
    ollamaBaseUrl: config.ollama.baseUrl,
  }, 'Attachment Summarizer Service starting');

  const orchestrator = new AttachmentSummarizerOrchestrator(config);

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    orchestrator.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Start the orchestrator (runs forever)
  await orchestrator.start();
}

main().catch((error) => {
  logger.error({ err: error }, 'Fatal error in main');
  process.exit(1);
});
