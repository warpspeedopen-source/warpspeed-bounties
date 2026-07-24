import { PrismaClient } from '@prisma/client';
import { createChildLogger } from '../utils/logger';
import { downloadAttachment, cleanupAttachment } from '../extractors/downloader';
import { categorizeAttachment, extractContent } from '../extractors/contentExtractor';
import { generateSummary } from '../summarizers/ollamaSummarizer';
import type { AttachmentEvent, ProcessingStatus } from '../models/types';

const log = createChildLogger('orchestrator');
const prisma = new PrismaClient();

/** Main processing pipeline for an attachment event */
export async function processAttachment(event: AttachmentEvent): Promise<void> {
  const { eventId, fileName } = event;
  log.info(`Processing attachment: ${fileName} (event: ${eventId})`);

  let localPath: string | null = null;

  try {
    // 1. Create or find attachment record
    const attachment = await upsertAttachment(event, 'PENDING');

    // 2. Download
    await updateStatus(attachment.id, 'DOWNLOADING');
    localPath = await downloadAttachment(event);
    await updateStatus(attachment.id, 'DOWNLOADED');
    await logProcessing(attachment.id, 'DOWNLOADED', `Downloaded ${fileName}`);

    // 3. Extract content
    await updateStatus(attachment.id, 'EXTRACTING');
    const category = categorizeAttachment(event);
    const content = await extractContent(localPath, category);
    await saveExtraction(attachment.id, content);
    await updateStatus(attachment.id, 'EXTRACTED');
    await logProcessing(
      attachment.id,
      'EXTRACTED',
      `Extracted ${content.wordCount} words from ${fileName}`,
    );

    // 4. Generate summary
    await updateStatus(attachment.id, 'SUMMARIZING');
    const summary = await generateSummary(content.rawText, { maxWords: 200 });
    await saveSummary(attachment.id, summary);
    await updateStatus(attachment.id, 'COMPLETED');
    await logProcessing(
      attachment.id,
      'COMPLETED',
      `Summary generated (${summary.tokensOut || '?'} tokens)`,
    );

    log.info(`Attachment ${eventId} processed successfully`);
  } catch (err) {
    const errorMessage = (err as Error).message;
    log.error(`Processing failed for ${eventId}: ${errorMessage}`);
    try {
      const attachment = await prisma.attachment.findUnique({
        where: { eventId },
      });
      if (attachment) {
        await prisma.attachment.update({
          where: { id: attachment.id },
          data: {
            status: 'FAILED',
            errorMessage,
            retryCount: { increment: 1 },
          },
        });
        await logProcessing(attachment.id, 'FAILED', errorMessage);
      }
    } catch (dbErr) {
      log.error(`Failed to update error status: ${dbErr}`);
    }
  } finally {
    if (localPath) {
      await cleanupAttachment(localPath);
    }
  }
}

// ── Database helpers ─────────────────────────────────────────

async function upsertAttachment(
  event: AttachmentEvent,
  status: ProcessingStatus,
) {
  return prisma.attachment.upsert({
    where: { eventId: event.eventId },
    create: {
      eventId: event.eventId,
      sourceUrl: event.sourceUrl,
      bucket: event.bucket,
      objectPath: event.objectPath,
      fileName: event.fileName,
      mimeType: event.mimeType,
      fileSizeBytes: event.fileSizeBytes,
      status: status as any,
    },
    update: {
      status: status as any,
      fileName: event.fileName,
      mimeType: event.mimeType,
    },
  });
}

async function updateStatus(attachmentId: string, status: ProcessingStatus) {
  const updateData: any = { status };
  if (status === 'DOWNLOADED') updateData.downloadedAt = new Date();
  if (status === 'EXTRACTED') updateData.extractedAt = new Date();
  if (status === 'COMPLETED') updateData.summarizedAt = new Date();

  await prisma.attachment.update({
    where: { id: attachmentId },
    data: updateData,
  });
}

async function saveExtraction(
  attachmentId: string,
  content: { rawText: string; wordCount: number; charCount: number; pageCount?: number },
) {
  await prisma.attachmentExtraction.upsert({
    where: { attachmentId },
    create: {
      attachmentId,
      rawText: content.rawText,
      wordCount: content.wordCount,
      charCount: content.charCount,
      pageCount: content.pageCount,
    },
    update: {
      rawText: content.rawText,
      wordCount: content.wordCount,
      charCount: content.charCount,
      pageCount: content.pageCount,
    },
  });
}

async function saveSummary(
  attachmentId: string,
  summary: { summaryText: string; modelUsed: string; tokensIn?: number; tokensOut?: number; confidence?: number },
) {
  await prisma.attachmentSummary.upsert({
    where: { attachmentId },
    create: {
      attachmentId,
      summaryText: summary.summaryText,
      modelUsed: summary.modelUsed,
      tokensIn: summary.tokensIn,
      tokensOut: summary.tokensOut,
      confidence: summary.confidence,
    },
    update: {
      summaryText: summary.summaryText,
      modelUsed: summary.modelUsed,
      tokensIn: summary.tokensIn,
      tokensOut: summary.tokensOut,
      confidence: summary.confidence,
    },
  });
}

async function logProcessing(
  attachmentId: string,
  event: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  await prisma.processingLog.create({
    data: {
      attachmentId,
      event,
      level: event === 'FAILED' ? 'ERROR' : 'INFO',
      message,
      metadata: metadata || undefined,
    },
  });
}
