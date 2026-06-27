import fs from 'fs/promises';
import path from 'path';
import logger from '../lib/logger';
import { ExtractedContent, SupportedMimeType, SUPPORTED_MIME_TYPES } from '../types';

/**
 * Extracts text content from various attachment file types.
 * Supports PDF, Word, Excel, text, HTML, and image files (via OCR placeholder).
 */
export class ContentExtractor {
  /**
   * Extract text content from a file based on its MIME type.
   */
  async extract(filePath: string, mimeType: string, attachmentId: string): Promise<ExtractedContent> {
    if (!this.isSupported(mimeType)) {
      throw new Error(`Unsupported MIME type: ${mimeType}`);
    }

    logger.info({ filePath, mimeType, attachmentId }, 'Extracting content');

    const startTime = Date.now();
    let text: string;
    let contentType: string;

    if (mimeType === 'application/pdf') {
      text = await this.extractPdf(filePath);
      contentType = 'pdf';
    } else if (mimeType.includes('word') || mimeType.includes('msword')) {
      text = await this.extractWord(filePath);
      contentType = 'word';
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      text = await this.extractSpreadsheet(filePath);
      contentType = 'spreadsheet';
    } else if (mimeType === 'text/html') {
      text = await this.extractHtml(filePath);
      contentType = 'html';
    } else if (mimeType.startsWith('image/')) {
      text = await this.extractImage(filePath);
      contentType = 'image';
    } else {
      // text/plain fallback
      text = await fs.readFile(filePath, 'utf-8');
      contentType = 'text';
    }

    const duration = Date.now() - startTime;
    logger.info({ attachmentId, contentType, textLength: text.length, durationMs: duration }, 'Extraction complete');

    return {
      attachmentId,
      text,
      contentType,
      metadata: { extractedAt: new Date().toISOString(), durationMs: duration },
    };
  }

  isSupported(mimeType: string): boolean {
    return SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType);
  }

  private async extractPdf(filePath: string): Promise<string> {
    // pdf-parse library
    const pdfParse = require('pdf-parse');
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  }

  private async extractWord(filePath: string): Promise<string> {
    // mammoth for .docx, fallback for .doc
    try {
      const mammoth = require('mammoth');
      const buffer = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch {
      // Try extracting as plain text for old .doc files
      const buffer = await fs.readFile(filePath);
      return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r]/g, ' ').substring(0, 50000);
    }
  }

  private async extractSpreadsheet(filePath: string): Promise<string> {
    // xlsx library
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const texts: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      texts.push(`--- Sheet: ${sheetName} ---\n${csv}`);
    }

    return texts.join('\n\n');
  }

  private async extractHtml(filePath: string): Promise<string> {
    // Simple HTML-to-text: strip tags
    const content = await fs.readFile(filePath, 'utf-8');
    return content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async extractImage(filePath: string): Promise<string> {
    // For images, we use Ollama's multimodal capabilities
    // Read the file and encode as base64 for the LLM
    const buffer = await fs.readFile(filePath);
    const base64 = buffer.toString('base64');
    return `[IMAGE:${path.basename(filePath)}:${base64.length}bytes]`;
  }
}

export default ContentExtractor;
