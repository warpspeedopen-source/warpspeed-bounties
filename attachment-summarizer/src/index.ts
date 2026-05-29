import { pollQueue } from './sqsConsumer';
import { config } from './config';

async function main() {
  if (!config.sqsQueueUrl) {
    console.warn('SQS_QUEUE_URL is not set. Service will not poll.');
    process.exit(1);
  }
  console.log('Starting Attachment Summarizer Service...');
  await pollQueue();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
