import { logger } from "./logger.js";
import { extractAttachment } from "./extractors/index.js";
import { OllamaClient } from "./llm/ollamaClient.js";
import { AttachmentRepository } from "./persistence/attachmentRepository.js";
import { QueueMessage, SqsConsumer } from "./queue/sqsConsumer.js";
import { GcsAttachmentClient } from "./storage/gcsClient.js";

export class AttachmentWorker {
  constructor(
    private readonly queue = new SqsConsumer(),
    private readonly storage = new GcsAttachmentClient(),
    private readonly llm = new OllamaClient(),
    private readonly repository = new AttachmentRepository(),
  ) {}

  async pollOnce(): Promise<number> {
    const messages = await this.queue.receive();
    await Promise.all(messages.map((message) => this.handle(message)));
    return messages.length;
  }

  async handle(message: QueueMessage): Promise<void> {
    const { event } = message;
    logger.info({ eventId: event.eventId, objectName: event.objectName }, "Processing attachment");

    try {
      await this.repository.markProcessing(event);
      const bytes = await this.storage.download(event);
      const extracted = await extractAttachment(event, bytes);
      const summary = await this.llm.summarize(extracted.text);
      await this.repository.markCompleted(event.eventId, extracted, summary);
      await this.queue.ack(message.raw);
      logger.info({ eventId: event.eventId }, "Attachment summarized");
    } catch (error) {
      await this.repository.markFailed(event.eventId, error).catch((repoError) => {
        logger.error({ repoError, eventId: event.eventId }, "Failed to record job failure");
      });
      logger.error({ error, eventId: event.eventId }, "Attachment processing failed");
    }
  }

  async shutdown(): Promise<void> {
    await this.repository.disconnect();
  }
}

