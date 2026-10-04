import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface SQSMessage {
  MessageId: string;
  ReceiptHandle: string;
  Body: string;
}

export class SQSService {
  private sqsClient: SQSClient;
  private queueUrl: string;

  constructor() {
    this.sqsClient = new SQSClient({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
    this.queueUrl = config.aws.sqsUrl;
  }

  async receiveMessages(maxNumberOfMessages: number = 1, waitTimeSeconds: number = 20): Promise<SQSMessage[]> {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: maxNumberOfMessages,
        WaitTimeSeconds: waitTimeSeconds,
      });

      const response = await this.sqsClient.send(command);
      return response.Messages || [];
    } catch (error) {
      logger.error('Error receiving messages from SQS', { error });
      throw new Error('Failed to receive messages from SQS');
    }
  }

  async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await this.sqsClient.send(command);
    } catch (error) {
      logger.error('Error deleting message from SQS', { receiptHandle, error });
      throw new Error('Failed to delete message from SQS');
    }
  }
}