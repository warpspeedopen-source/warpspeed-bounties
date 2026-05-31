import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  ChangeMessageVisibilityCommand,
  Message
} from '@aws-sdk/client-sqs';
import { StorageDownloader } from './storageDownloader';
import { LlmSummarizer } from './llmSummarizer';
import { logger } from '../utils/logger';
import * as fs from 'fs';

export interface AttachmentEvent {
  bucket: string;
  key: string;
  contentType?: string;
  [key: string]: any;
}

export class QueueListener {
  private sqsClient: SQSClient;
  private queueUrl: string;
  private storageDownloader: StorageDownloader;
  private llmSummarizer: LlmSummarizer;
  private isRunning: boolean = false;

  constructor(storageDownloader: StorageDownloader, llmSummarizer: LlmSummarizer) {
    this.storageDownloader = storageDownloader;
    this.llmSummarizer = llmSummarizer;

    this.queueUrl = process.env.SQS_QUEUE_URL || '';
    const region = process.env.AWS_REGION || 'us-east-1';

    if (!this.queueUrl) {
      logger.warn('SQS_QUEUE_URL environment variable is not defined. Polling will fail unless configured dynamically.');
    }

    try {
      this.sqsClient = new SQSClient({ region });
      logger.info('Initialized AWS SQS Client', { region, queueUrl: this.queueUrl });
    } catch (error) {
      logger.error('Failed to initialize AWS SQS Client', error);
      throw error;
    }
  }

  /**
   * Starts the polling loop to receive events from SQS.
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('QueueListener is already running.');
      return;
    }

    if (!this.queueUrl) {
      throw new Error('Cannot start QueueListener: SQS_QUEUE_URL is not configured.');
    }

    this.isRunning = true;
    logger.info('QueueListener started, entering poll loop...');

    this.pollLoop();
  }

  /**
   * Stops the polling loop gracefully.
   */
  public async stop(): Promise<void> {
    logger.info('Stopping QueueListener gracefully...');
    this.isRunning = false;
  }

  /**
   * Continuous SQS polling loop
   */
  private async pollLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        logger.debug('Polling SQS for messages...', { queueUrl: this.queueUrl });

        const command = new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 20, // Long polling (cost-efficient)
          VisibilityTimeout: 120 // 2 minutes visibility buffer for GCS download + LLM run
        });

        const response = await this.sqsClient.send(command);

        if (response.Messages && response.Messages.length > 0) {
          logger.info(`Received ${response.Messages.length} message(s) from SQS.`);
          for (const message of response.Messages) {
            if (!this.isRunning) break;
            await this.processMessage(message);
          }
        } else {
          logger.debug('No messages received during this poll interval.');
        }
      } catch (error) {
        logger.error('Error in SQS poll loop', error);
        // Backoff to avoid hot-looping when SQS is down or credentials expire
        if (this.isRunning) {
          logger.info('Sleeping for 5 seconds before retrying SQS poll due to error...');
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }
    logger.info('QueueListener poll loop exited.');
  }

  /**
   * Processes a single SQS message
   */
  private async processMessage(message: Message): Promise<void> {
    const messageId = message.MessageId;
    const receiptHandle = message.ReceiptHandle;

    if (!receiptHandle) {
      logger.error('Received SQS message without a ReceiptHandle, cannot process.', null, { messageId });
      return;
    }

    logger.info('Processing SQS message', { messageId });
    let localFilePath: string | null = null;

    try {
      if (!message.Body) {
        throw new Error('SQS message body is empty.');
      }

      // 1. Parse JSON Body
      let event: AttachmentEvent;
      try {
        event = JSON.parse(message.Body) as AttachmentEvent;
      } catch (parseError) {
        logger.warn('Failed to parse message body as JSON. Deleting poison message to avoid blocking queue.', {
          messageId,
          body: message.Body
        });
        await this.deleteMessage(receiptHandle);
        return;
      }

      // 2. Validate Event Schema
      const { bucket, key } = event;
      if (!bucket || !key) {
        logger.warn('Invalid event payload: Missing bucket or key parameter. Deleting message.', {
          messageId,
          event
        });
        await this.deleteMessage(receiptHandle);
        return;
      }

      // 3. Download Attachment from GCS
      localFilePath = await this.storageDownloader.downloadFile(bucket, key);

      // 4. Summarize local file content
      const summary = await this.llmSummarizer.summarize(localFilePath);

      // 5. Output Summary to Logs (and placeholder for db / webhook)
      logger.info('SUMMARY CREATED SUCCESSFULLY', {
        messageId,
        gcsPath: `gs://${bucket}/${key}`,
        summary: summary
      });

      // 6. Delete message from queue upon success
      await this.deleteMessage(receiptHandle);
      logger.info(`Message ${messageId} deleted from SQS queue successfully.`);

    } catch (error) {
      logger.error('Error processing SQS message', error, { messageId });

      // Reset visibility to 0 so it can be retried immediately by another worker
      try {
        logger.info('Resetting SQS message visibility timeout for immediate retry...', { messageId });
        const changeVisibilityCommand = new ChangeMessageVisibilityCommand({
          QueueUrl: this.queueUrl,
          ReceiptHandle: receiptHandle,
          VisibilityTimeout: 0
        });
        await this.sqsClient.send(changeVisibilityCommand);
      } catch (visibilityError) {
        logger.error('Failed to reset message visibility timeout', visibilityError, { messageId });
      }
    } finally {
      // 7. Cleanup the temporary downloaded file to prevent disk fill-up
      if (localFilePath && fs.existsSync(localFilePath)) {
        try {
          fs.unlinkSync(localFilePath);
          logger.debug('Cleaned up local temporary downloaded file', { localFilePath });
        } catch (cleanupError) {
          logger.error(`Failed to delete local temporary file: ${localFilePath}`, cleanupError);
        }
      }
    }
  }

  /**
   * Helper to delete message from SQS
   */
  private async deleteMessage(receiptHandle: string): Promise<void> {
    const deleteCommand = new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle
    });
    await this.sqsClient.send(deleteCommand);
  }
}
