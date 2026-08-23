import { downloadFromGCS } from './gcs';
import { extractContent } from './extractor';
import { summarizeText } from './summarizer';
import { logger } from './logger';

export interface AttachmentEvent {
  bucket: string;
  fileName: string;
  mimeType: string;
  userId: string;
  attachmentId: string;
}

export async function processAttachment(event: AttachmentEvent) {
  logger.info('Processing attachment', { attachmentId: event.attachmentId });
  
  try {
    const fileBuffer = await downloadFromGCS(event.bucket, event.fileName);
    const content = await extractContent(fileBuffer, event.mimeType);
    
    if (!content) {
      logger.warn('No content extracted', { attachmentId: event.attachmentId });
      return;
    }

    const summary = await summarizeText(content);
    logger.info('Summary generated', { attachmentId: event.attachmentId, summaryLength: summary.length });
    
    // TODO: Save summary to database via Prisma
  } catch (err) {
    logger.error('Failed to process attachment', { attachmentId: event.attachmentId, err });
    throw err;
  }
}