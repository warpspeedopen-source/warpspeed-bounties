import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { logger } from './logger';
import { processAttachment } from './processor';

const sqs = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const queueUrl = process.env.SQS_QUEUE_URL || '';

export async function consumeSQSMessages() {
  if (!queueUrl) {
    logger.error('SQS_QUEUE_URL is not defined');
    return;
  }

  logger.info(`Listening to SQS queue: ${queueUrl}`);

  while (true) {
    try {
      const data = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      }));

      if (data.Messages) {
        for (const message of data.Messages) {
          if (message.Body && message.ReceiptHandle) {
            try {
              const event = JSON.parse(message.Body);
              await processAttachment(event);
              
              await sqs.send(new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: message.ReceiptHandle,
              }));
            } catch (err) {
              logger.error('Error processing message', { err, messageId: message.MessageId });
            }
          }
        }
      }
    } catch (err) {
      logger.error('Error receiving messages from SQS', { err });
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}