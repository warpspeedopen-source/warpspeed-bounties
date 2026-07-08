import { logger } from '../utils/logger';
import { AttachmentEvent, SummaryResult } from '../types';
import { downloadFromGCS } from './gcs-downloader';
import { extractContent } from './content-extractor';
import { summarize } from './llm-summarizer';

export interface AttachmentProcessor {
  process: (event: AttachmentEvent) => Promise<SummaryResult | null>;
}

export function createAttachmentProcessor(): AttachmentProcessor {
  return {
    async process(event: AttachmentEvent): Promise<SummaryResult | null> {
      logger.info(`Processing ${event.fileName} (${event.contentType})`);

      try {
        const buffer = await downloadFromGCS(event.bucketName, event.objectPath);
        const extraction = await extractContent(buffer, event.contentType, event.fileName);

        if (!extraction.text.trim()) {
          return {
            attachmentId: event.attachmentId,
            summary: 'No extractable text content.',
            metadata: { ...extraction.metadata, empty: true },
          };
        }

        const summary = await summarize(extraction.text, event.attachmentId);
        return summary;
      } catch (error) {
        logger.error(`Failed to process ${event.attachmentId}:`, error);
        return {
          attachmentId: event.attachmentId,
          summary: `Processing failed: ${String(error)}`,
          metadata: { error: String(error) },
        };
      }
    },
  };
}