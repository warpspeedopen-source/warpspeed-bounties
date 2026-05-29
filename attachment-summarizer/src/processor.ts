import { PrismaClient } from '@prisma/client';
import { downloadFromGCS } from './gcsDownloader';
import { extractText } from './extractor';
import { summarizeText } from './llm';
import * as fs from 'fs';

const prisma = new PrismaClient();

export async function processMessage(messageId: string, payload: any) {
  const { bucket, objectKey, mimeType } = payload;
  
  if (!bucket || !objectKey || !mimeType) {
    throw new Error('Invalid payload: missing bucket, objectKey, or mimeType');
  }
  
  let downloadedPath: string | null = null;
  
  try {
    downloadedPath = await downloadFromGCS(bucket, objectKey);
    const text = await extractText(downloadedPath, mimeType);
    const summary = await summarizeText(text);
    
    await prisma.attachmentSummary.create({
      data: {
        messageId,
        bucket,
        objectKey,
        summary,
        status: 'COMPLETED'
      }
    });
    
  } catch (err: any) {
    await prisma.attachmentSummary.create({
      data: {
        messageId,
        bucket,
        objectKey,
        summary: '',
        status: 'ERROR',
        errorMessage: err.message
      }
    });
    throw err;
  } finally {
    if (downloadedPath && fs.existsSync(downloadedPath)) {
      fs.unlinkSync(downloadedPath);
    }
  }
}
