import * as dotenv from 'dotenv';
import { logger } from './utils/logger';
import { StorageDownloader } from './services/storageDownloader';
import { LlmSummarizer } from './services/llmSummarizer';
import { QueueListener } from './services/queueListener';

// Load environment variables from local .env config
dotenv.config();

logger.info('Starting Attachment Summarizer Service...');

async function main() {
  try {
    // 1. Instantiate the GCS and Ollama clients, injecting them into the SQS processor
    const storageDownloader = new StorageDownloader();
    const llmSummarizer = new LlmSummarizer();
    const queueListener = new QueueListener(storageDownloader, llmSummarizer);

    // 2. Setup signal listeners for seamless Kubernetes or Docker graceful shutdowns
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown sequence...`);
      await queueListener.stop();
      logger.info('Service shutdown complete. Safe to exit.');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    // Catch all unhandled process failures to guarantee robust diagnostics
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Promise Rejection', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error, { fatal: true });
      process.exit(1);
    });

    // 3. Start SQS Event Consumption
    await queueListener.start();

  } catch (error) {
    logger.error('Fatal failure during service startup sequence', error);
    process.exit(1);
  }
}

main();
