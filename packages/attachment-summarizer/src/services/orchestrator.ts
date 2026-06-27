import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { SqsConsumer } from './sqs-consumer';
import { GcsDownloader } from './gcs-downloader';
import { ContentExtractor } from './content-extractor';
import { OllamaSummarizer } from './ollama-summarizer';
import { SqsAttachmentEvent, AppConfig } from '../types';

/**
 * Orchestrator that ties together SQS consumption, GCS download,
 * content extraction, and LLM summarization.
 */
export class AttachmentSummarizerOrchestrator {
  private sqsConsumer: SqsConsumer;
  private gcsDownloader: GcsDownloader;
  private contentExtractor: ContentExtractor;
  private ollamaSummarizer: OllamaSummarizer;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;

    this.sqsConsumer = new SqsConsumer({
      region: config.aws.region,
      queueUrl: config.aws.sqsQueueUrl,
      pollIntervalMs: config.aws.sqsPollIntervalMs,
      maxMessages: config.aws.sqsMaxMessages,
      visibilityTimeout: config.aws.sqsVisibilityTimeout,
    });

    this.gcsDownloader = new GcsDownloader({
      serviceAccountKey: config.gcs.serviceAccountKey,
      tempDir: config.processing.tempDir,
      maxFileSizeBytes: config.processing.maxFileSizeBytes,
    });

    this.contentExtractor = new ContentExtractor();
    this.ollamaSummarizer = new OllamaSummarizer({
      baseUrl: config.ollama.baseUrl,
      model: config.ollama.model,
      timeoutMs: config.ollama.timeoutMs,
    });
  }

  async start(): Promise<void> {
    logger.info('Starting Attachment Summarizer Orchestrator');

    await this.sqsConsumer.start(async (event: SqsAttachmentEvent) => {
      await this.processAttachment(event);
    });
  }

  stop(): void {
    this.sqsConsumer.stop();
  }

  private async processAttachment(event: SqsAttachmentEvent): Promise<void> {
    const { attachmentId, storageKey, bucketName, fileName, mimeType, fileSizeBytes } = event;

    logger.info({ attachmentId, fileName, mimeType }, 'Processing attachment');

    // 1. Create/update database record
    let localPath: string | null = null;

    try {
      await prisma.attachment.upsert({
        where: { id: attachmentId },
        update: { status: 'DOWNLOADING' },
        create: {
          id: attachmentId,
          messageId: event.messageId,
          storageKey,
          bucketName,
          fileName,
          mimeType,
          fileSizeBytes,
          status: 'DOWNLOADING',
        },
      });

      await prisma.attachmentEvent.create({
        data: {
          attachmentId,
          type: 'SQS_RECEIVED',
          payload: event as unknown as Record<string, unknown>,
        },
      });

      // 2. Download from GCS
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: { status: 'DOWNLOADING' },
      });

      localPath = await this.gcsDownloader.download(bucketName, storageKey, fileName);

      await prisma.attachmentEvent.create({
        data: {
          attachmentId,
          type: 'DOWNLOAD_COMPLETED',
          payload: { localPath },
        },
      });

      // 3. Extract content
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: { status: 'EXTRACTING' },
      });

      const extracted = await this.contentExtractor.extract(localPath, mimeType, attachmentId);

      await prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          status: 'EXTRACTED',
          extractedText: extracted.text,
          contentType: extracted.contentType,
        },
      });

      await prisma.attachmentEvent.create({
        data: {
          attachmentId,
          type: 'EXTRACTION_COMPLETED',
          payload: extracted.metadata as Record<string, unknown>,
        },
      });

      // 4. Generate summary
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: { status: 'SUMMARIZING' },
      });

      const summaryResult = await this.ollamaSummarizer.summarize(
        attachmentId,
        extracted.text,
        extracted.contentType
      );

      await prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          status: 'COMPLETED',
          summary: summaryResult.summary,
          summaryModel: summaryResult.model,
          processingTimeMs: summaryResult.processingTimeMs,
        },
      });

      await prisma.attachmentEvent.create({
        data: {
          attachmentId,
          type: 'SUMMARIZATION_COMPLETED',
          payload: summaryResult as unknown as Record<string, unknown>,
        },
      });

      logger.info({ attachmentId, durationMs: summaryResult.processingTimeMs }, 'Attachment processing complete');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error({ err: error, attachmentId }, 'Attachment processing failed');

      try {
        await prisma.attachment.update({
          where: { id: attachmentId },
          data: {
            status: 'FAILED',
            errorMessage,
          },
        });

        await prisma.attachmentEvent.create({
          data: {
            attachmentId,
            type: 'ERROR',
            payload: { error: errorMessage },
          },
        });
      } catch (dbError) {
        logger.error({ err: dbError }, 'Failed to update attachment error state');
      }
    } finally {
      // Clean up temp file
      if (localPath) {
        await this.gcsDownloader.cleanup(localPath);
      }
    }
  }
}

export default AttachmentSummarizerOrchestrator;
