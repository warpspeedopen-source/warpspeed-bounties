import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { AttachmentEvent, attachmentEventSchema } from "../types.js";

export type QueueMessage = {
  raw: Message;
  event: AttachmentEvent;
};

export class SqsConsumer {
  private readonly client = new SQSClient({ region: config.AWS_REGION });

  async receive(): Promise<QueueMessage[]> {
    const response = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: config.SQS_QUEUE_URL,
        MaxNumberOfMessages: config.WORKER_CONCURRENCY,
        WaitTimeSeconds: config.SQS_WAIT_TIME_SECONDS,
        VisibilityTimeout: config.SQS_VISIBILITY_TIMEOUT_SECONDS,
      }),
    );

    return (response.Messages ?? []).flatMap((message) => {
      try {
        const parsed = attachmentEventSchema.parse(JSON.parse(message.Body ?? "{}"));
        return [{ raw: message, event: parsed }];
      } catch (error) {
        logger.warn({ error, messageId: message.MessageId }, "Dropping invalid SQS payload");
        return [];
      }
    });
  }

  async ack(message: Message): Promise<void> {
    if (!message.ReceiptHandle) return;
    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: config.SQS_QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle,
      }),
    );
  }
}

