import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import logger from '../lib/logger';
import { SqsAttachmentEvent } from '../types';

export interface SqsConsumerOptions {
  region: string;
  queueUrl: string;
  pollIntervalMs: number;
  maxMessages: number;
  visibilityTimeout: number;
}

/**
 * Consumes attachment events from AWS SQS.
 * Runs a long-polling loop that yields parsed events.
 */
export class SqsConsumer {
  private client: SQSClient;
  private options: SqsConsumerOptions;
  private running = false;

  constructor(options: SqsConsumerOptions) {
    this.client = new SQSClient({ region: options.region });
    this.options = options;
  }

  async start(handler: (event: SqsAttachmentEvent) => Promise<void>): Promise<void> {
    this.running = true;
    logger.info({ queueUrl: this.options.queueUrl }, 'Starting SQS consumer');

    while (this.running) {
      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: this.options.queueUrl,
          MaxNumberOfMessages: this.options.maxMessages,
          VisibilityTimeout: this.options.visibilityTimeout,
          WaitTimeSeconds: 20, // long polling
        });

        const response = await this.client.send(command);

        if (response.Messages && response.Messages.length > 0) {
          for (const message of response.Messages) {
            await this.processMessage(message, handler);
          }
        }
      } catch (error) {
        logger.error({ err: error }, 'Error polling SQS');
        // Back off on error before retry
        await this.sleep(5000);
      }
    }
  }

  stop(): void {
    this.running = false;
    logger.info('Stopping SQS consumer');
  }

  private async processMessage(
    message: Message,
    handler: (event: SqsAttachmentEvent) => Promise<void>
  ): Promise<void> {
    const receiptHandle = message.ReceiptHandle;
    if (!message.Body || !receiptHandle) {
      return;
    }

    try {
      const event: SqsAttachmentEvent = JSON.parse(message.Body);

      // Validate required fields
      if (!event.attachmentId || !event.storageKey || !event.bucketName) {
        logger.warn({ event }, 'Invalid SQS event - missing required fields');
        // Delete invalid message so it doesn't block the queue
        await this.deleteMessage(receiptHandle);
        return;
      }

      await handler(event);

      // Delete message after successful processing
      await this.deleteMessage(receiptHandle);
    } catch (error) {
      logger.error({ err: error, messageId: message.MessageId }, 'Failed to process SQS message');
      // Do NOT delete - message will become visible again after visibility timeout
      // This acts as a retry mechanism
    }
  }

  private async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.options.queueUrl,
        ReceiptHandle: receiptHandle,
      });
      await this.client.send(command);
    } catch (error) {
      logger.error({ err: error }, 'Failed to delete SQS message');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default SqsConsumer;
