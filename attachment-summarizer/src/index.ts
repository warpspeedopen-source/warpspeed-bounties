import { consumeSQSMessages } from './consumer';
import { logger } from './logger';

async function main() {
  logger.info('Starting Attachment Summarizer Service...');
  await consumeSQSMessages();
}

main().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});