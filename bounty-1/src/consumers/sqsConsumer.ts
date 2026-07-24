import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, ChangeMessageVisibilityCommand } from '@aws-sdk/client-sqs';
import { createChildLogger } from '../utils/logger';
import type { AttachmentEvent } from '../models/types';

const log = createChildLogger('sqs-consumer');

const SQS_REGION = process.env.AWS_REGION || 'us-east-1';
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || '';
const SQS_POLL_INTERVAL_MS = parseInt(process.env.SQS_POLL_INTERVAL_MS || '5000', 10);
const SQS_VISIBILITY_TIMEOUT = parseInt(process.env.SQS_VISIBILITY_TIMEOUT || '300', 10);
const MAX_MESSAGES = 10;

export type MessageHandler = (event: AttachmentEvent) => Promise<void>;

/** SQS consumer that polls for attachment events */
export class SQSConsumer {
  private client: SQSClient;
  private running = false;
  private handler: MessageHandler;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(handler: MessageHandler) {
    this.client = new SQSClient({
      region: SQS_REGION,
      ...(process.env.AWS_ACCESS_KEY_ID
        ? {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    });
    this.handler = handler;
  }

  /** Start polling the SQS queue */
  start(): void {
    if (this.running) {
      log.warn('SQS consumer already running');
      return;
    }
    this.running = true;
    log.info(`Starting SQS consumer (queue: ${SQS_QUEUE_URL})`);
    this.poll();
  }

  /** Stop the consumer gracefully */
  stop(): void {
    this.running = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    log.info('SQS consumer stopped');
  }

  /** Single poll cycle */
  private async poll(): Promise<void> {
    if (!this.running) return;

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: SQS_QUEUE_URL,
        MaxNumberOfMessages: MAX_MESSAGES,
        VisibilityTimeout: SQS_VISIBILITY_TIMEOUT,
        WaitTimeSeconds: 20, // long polling
        MessageAttributeNames: ['All'],
        AttributeNames: ['All'],
      });

      const response = await this.client.send(command);

      if (response.Messages && response.Messages.length > 0) {
        log.info(`Received ${response.Messages.length} message(s)`);
        await Promise.allSettled(
          response.Messages.map((msg) => this.processMessage(msg)),
        );
      }
    } catch (err) {
      log.error('SQS poll error', { error: (err as Error).message });
    }

    if (this.running) {
      this.pollTimer = setTimeout(() => this.poll(), SQS_POLL_INTERVAL_MS);
    }
  }

  /** Process a single SQS message */
  private async processMessage(msg: any): Promise<void> {
    const receiptHandle = msg.ReceiptHandle;
    const messageId = msg.MessageId;

    try {
      // Parse the event body
      let body: any;
      try {
        body = JSON.parse(msg.Body || '{}');
      } catch {
        body = msg.Body || {};
      }

      // Handle SNS-wrapped SQS messages
      if (body.Type === 'Notification' && body.Message) {
        body = JSON.parse(body.Message);
      }

      const event: AttachmentEvent = {
        eventId: body.eventId || body.id || messageId || `evt-${Date.now()}`,
        sourceUrl: body.sourceUrl || body.url || body.source_url || '',
        bucket: body.bucket,
        objectPath: body.objectPath || body.object_path || body.key || body.path,
        fileName: body.fileName || body.file_name || body.name || 'unknown',
        mimeType: body.mimeType || body.mime_type || body.contentType || 'application/octet-stream',
        fileSizeBytes: body.fileSizeBytes || body.size,
        messageId: body.messageId || body.message_id,
        eventTimestamp: body.eventTimestamp || body.timestamp || body.event_time,
      };

      if (!event.sourceUrl && !event.objectPath) {
        log.warn(`Skipping message ${messageId}: no source URL or path`);
        await this.deleteMessage(receiptHandle);
        return;
      }

      await this.handler(event);
      await this.deleteMessage(receiptHandle);
      log.info(`Message ${messageId} processed successfully`);
    } catch (err) {
      log.error(`Failed to process message ${messageId}`, {
        error: (err as Error).message,
      });
      // Don't delete — let visibility timeout expire for retry
    }
  }

  /** Delete a successfully processed message */
  private async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl: SQS_QUEUE_URL,
          ReceiptHandle: receiptHandle,
        }),
      );
    } catch (err) {
      log.warn(`Failed to delete message: ${(err as Error).message}`);
    }
  }

  /** Check if SQS is reachable */
  async checkHealth(): Promise<boolean> {
    try {
      // Just try receiving; if it throws, SQS is unavailable
      await this.client.send(
        new ReceiveMessageCommand({
          QueueUrl: SQS_QUEUE_URL,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 1,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
