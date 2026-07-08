import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { createSqsConsumer } from './services/sqs-consumer';
import { createAttachmentProcessor } from './services/attachment-processor';

dotenv.config();

async function main(): Promise<void> {
  logger.info('Attachment Summarizer Service starting...');

  const processor = createAttachmentProcessor();
  const consumer = createSqsConsumer(processor);

  await consumer.start();

  logger.info('Service started. Listening for messages on SQS...');

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down...');
    await consumer.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
