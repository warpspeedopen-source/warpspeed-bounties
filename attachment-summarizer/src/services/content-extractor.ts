import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as cheerio from 'cheerio';
import { ExtractionResult } from '../types';
import { logger } from '../utils/logger';

export async function extractContent(
  buffer: Buffer,
  contentType: string,
  fileName: string
): Promise<ExtractionResult> {
  logger.info(`Extracting content from ${fileName} (${contentType})`);

  try {
    switch (contentType) {
      case 'application/pdf':
        return await extractPdf(buffer);
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await extractWord(buffer);
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return await extractExcel(buffer);
      case 'text/html':
        return await extractHtml(buffer);
      case 'text/plain':
        return await extractPlainText(buffer);
      default:
        logger.warn(`Unsupported content type: ${contentType}`);
        return { text: '', metadata: { error: 'Unsupported file type' } };
    }
  } catch (error) {
    logger.error(`Extraction failed for ${fileName}:`, error);
    return { text: '', metadata: { error: String(error) } };
  }
}

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  const data = await pdfParse(buffer);
  return { text: data.text, metadata: { pages: data.numpages } };
}

async function extractWord(buffer: Buffer): Promise<ExtractionResult> {
  const result = await mammoth.extractRawText({ buffer });
  return { text: result.value, metadata: { messages: result.messages } };
}

async function extractExcel(buffer: Buffer): Promise<ExtractionResult> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const allText = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    return XLSX.utils.sheet_to_csv(sheet);
  }).join('\n\n');
  return { text: allText, metadata: { sheets: workbook.SheetNames } };
}

async function extractHtml(buffer: Buffer): Promise<ExtractionResult> {
  const html = buffer.toString('utf-8');
  const $ = cheerio.load(html);
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return { text, metadata: { title: $('title').text() } };
}

async function extractPlainText(buffer: Buffer): Promise<ExtractionResult> {
  const text = buffer.toString('utf-8');
  return { text, metadata: { length: text.length } };
}
