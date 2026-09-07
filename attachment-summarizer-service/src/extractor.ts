import * as fs from 'fs';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import * as cheerio from 'cheerio';
import { logger } from './logger';

export class Extractor {
  static async extract(mimeType: string, buffer: Buffer): Promise<{ text?: string, isImage: boolean }> {
    logger.info(`Extracting text for mime type: ${mimeType}`);
    
    if (mimeType === 'application/pdf') {
      const data = await pdfParse(buffer);
      return { text: data.text, isImage: false };
    } 
    
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value, isImage: false };
    }

    if (mimeType.startsWith('application/vnd.ms-excel') || mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')) {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      let text = '';
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        text += xlsx.utils.sheet_to_txt(sheet) + '\n';
      }
      return { text, isImage: false };
    }

    if (mimeType === 'text/html') {
      const $ = cheerio.load(buffer.toString('utf-8'));
      return { text: $('body').text(), isImage: false };
    }

    if (mimeType.startsWith('text/')) {
      return { text: buffer.toString('utf-8'), isImage: false };
    }

    if (mimeType.startsWith('image/')) {
      // Return image buffer info so it can be passed to vision model
      return { text: buffer.toString('base64'), isImage: true };
    }

    throw new Error(`Unsupported mime type: ${mimeType}`);
  }
}
