import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { logger } from './logger';

export interface ExtractedContent {
  text: string;
  metadata?: Record<string, any>;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const data = await pdfParse(buffer);
    return { text: data.text };
  } catch (error) {
    logger.error('Error extracting text from PDF', { error });
    throw new Error('Failed to extract text from PDF');
  }
}

export async function extractTextFromDocx(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value };
  } catch (error) {
    logger.error('Error extracting text from DOCX', { error });
    throw new Error('Failed to extract text from DOCX');
  }
}

export async function extractTextFromXlsx(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    let text = '';

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      text += XLSX.utils.sheet_to_txt(worksheet);
    }

    return { text };
  } catch (error) {
    logger.error('Error extracting text from XLSX', { error });
    throw new Error('Failed to extract text from XLSX');
  }
}

export async function extractTextFromTxt(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const text = buffer.toString('utf-8');
    return { text };
  } catch (error) {
    logger.error('Error extracting text from TXT', { error });
    throw new Error('Failed to extract text from TXT');
  }
}

export async function extractTextFromHtml(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const text = buffer.toString('utf-8');
    // Basic HTML tag removal - in production, use a proper HTML parser
    const cleanText = text.replace(/<[^>]*>/g, ' ');
    return { text: cleanText };
  } catch (error) {
    logger.error('Error extracting text from HTML', { error });
    throw new Error('Failed to extract text from HTML');
  }
}

export async function extractTextFromImage(buffer: Buffer): Promise<ExtractedContent> {
  // In a real implementation, you would use OCR like Tesseract.js
  // For now, we'll return a placeholder
  logger.warn('Image extraction not implemented, returning placeholder');
  return { text: '[Image content - OCR not implemented]' };
}

export async function extractContent(buffer: Buffer, mimeType: string): Promise<ExtractedContent> {
  switch (mimeType) {
    case 'application/pdf':
      return extractTextFromPDF(buffer);
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractTextFromDocx(buffer);
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return extractTextFromXlsx(buffer);
    case 'text/plain':
      return extractTextFromTxt(buffer);
    case 'text/html':
      return extractTextFromHtml(buffer);
    case 'image/jpeg':
    case 'image/png':
    case 'image/gif':
      return extractTextFromImage(buffer);
    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
}