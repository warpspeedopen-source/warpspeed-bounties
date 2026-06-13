import { extractText } from './textExtractor';
import { generateSummary } from './llmClient';
import { downloadFromGCS } from './gcsClient';
import { prisma } from './prismaClient';
import { logger } from './logger';

export async function processAttachment(event: any) {
  const { attachmentId, gcsBucket, gcsObject, messageId } = event;
  logger.info({ attachmentId, gcsObject }, 'Processing attachment');

  try {
    const localPath = await downloadFromGCS(gcsBucket, gcsObject);
    const text = await extractText(localPath, gcsObject);
    if (text.length === 0) {
      logger.warn({ attachmentId }, 'No text extracted');
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: { status: 'NO_TEXT', summary: null },
      });
      return;
    }
    const summary = await generateSummary(text);
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: { status: 'SUMMARIZED', summary },
    });
    logger.info({ attachmentId }, 'Successfully processed');
  } catch (error) {
    logger.error({ attachmentId, error }, 'Failed to process attachment');
    // Move to DLQ? For now, log and rethrow to trigger SQS visibility timeout
    throw error;
  }
}