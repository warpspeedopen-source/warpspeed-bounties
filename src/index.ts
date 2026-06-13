import { Consumer } from 'sqs-consumer';
import { SQSClient } from '@aws-sdk/client-sqs';
import { processAttachment } from './attachmentProcessor';
import { logger } from './logger';

const app = Consumer.create({
  queueUrl: process.env.SQS_QUEUE_URL!,
  handleMessage: async (message) => {
    const event = JSON.parse(message.Body!);
    await processAttachment(event);
  },
  sqs: new SQSClient({ region: process.env.AWS_REGION }),
  batchSize: 1,
  pollingWaitTimeMs: 10000,
});

app.on('error', (err) => {
  logger.error(err, 'Consumer error');
});

app.on('processing_error', (err) => {
  logger.error(err, 'Processing error');
});

app.start();
console.log('Service started');