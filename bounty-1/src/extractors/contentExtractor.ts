import fs from 'fs/promises';
import path from 'path';
import { createChildLogger } from '../utils/logger';
import { AttachmentCategory } from '../models/types';
import type { AttachmentEvent, ExtractedContent } from '../models/types';

const log = createChildLogger('extractor');

/** Determine attachment category from MIME type or filename */
export function categorizeAttachment(event: AttachmentEvent): AttachmentCategory {
  const mime = (event.mimeType || '').toLowerCase();
  const name = (event.fileName || '').toLowerCase();

  if (
    mime.includes('pdf') ||
    name.endsWith('.pdf')
  ) {
    return AttachmentCategory.PDF;
  }
  if (
    mime.includes('wordprocessingml') ||
    mime.includes('msword') ||
    name.endsWith('.docx') ||
    name.endsWith('.doc')
  ) {
    return AttachmentCategory.DOCX;
  }
  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('csv') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    name.endsWith('.csv')
  ) {
    return AttachmentCategory.SPREADSHEET;
  }
  if (
    mime.includes('html') ||
    name.endsWith('.html') ||
    name.endsWith('.htm')
  ) {
    return AttachmentCategory.HTML;
  }
  if (
    mime.includes('image') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.gif') ||
    name.endsWith('.webp')
  ) {
    return AttachmentCategory.IMAGE;
  }
  if (
    mime.includes('text') ||
    name.endsWith('.txt') ||
    name.endsWith('.log') ||
    name.endsWith('.md') ||
    name.endsWith('.json') ||
    name.endsWith('.xml') ||
    name.endsWith('.yaml') ||
    name.endsWith('.yml')
  ) {
    return AttachmentCategory.TEXT;
  }

  return AttachmentCategory.UNKNOWN;
}

/** Extract text content from an attachment file */
export async function extractContent(
  localPath: string,
  category: AttachmentCategory,
): Promise<ExtractedContent> {
  log.info(`Extracting content from ${localPath} (${category})`);

  switch (category) {
    case AttachmentCategory.PDF:
      return extractPDF(localPath);
    case AttachmentCategory.DOCX:
      return extractDOCX(localPath);
    case AttachmentCategory.TEXT:
      return extractText(localPath);
    case AttachmentCategory.HTML:
      return extractHTML(localPath);
    case AttachmentCategory.IMAGE:
      return extractImage(localPath);
    case AttachmentCategory.SPREADSHEET:
      return extractSpreadsheet(localPath);
    default:
      return extractText(localPath);
  }
}

// ── PDF Extraction ───────────────────────────────────────────
async function extractPDF(localPath: string): Promise<ExtractedContent> {
  const pdfParse = require('pdf-parse');
  const dataBuffer = await fs.readFile(localPath);
  const result = await pdfParse(dataBuffer);
  return {
    rawText: result.text,
    wordCount: result.text.split(/\s+/).filter(Boolean).length,
    charCount: result.text.length,
    pageCount: result.numpages,
  };
}

// ── DOCX Extraction ──────────────────────────────────────────
async function extractDOCX(localPath: string): Promise<ExtractedContent> {
  const mammoth = require('mammoth');
  const buffer = await fs.readFile(localPath);
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value || '';
  return {
    rawText: text,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    charCount: text.length,
  };
}

// ── Plain Text Extraction ────────────────────────────────────
async function extractText(localPath: string): Promise<ExtractedContent> {
  const text = await fs.readFile(localPath, 'utf-8');
  return {
    rawText: text,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    charCount: text.length,
  };
}

// ── HTML Extraction ──────────────────────────────────────────
async function extractHTML(localPath: string): Promise<ExtractedContent> {
  const text = await fs.readFile(localPath, 'utf-8');
  // Simple HTML tag stripping — production should use cheerio/jsdom
  const stripped = text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    rawText: stripped,
    wordCount: stripped.split(/\s+/).filter(Boolean).length,
    charCount: stripped.length,
  };
}

// ── Image (OCR) Extraction ───────────────────────────────────
async function extractImage(localPath: string): Promise<ExtractedContent> {
  try {
    const Tesseract = require('tesseract.js');
    const { data } = await Tesseract.recognize(localPath, 'eng');
    const text = data.text || '';
    return {
      rawText: text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      charCount: text.length,
      metadata: { confidence: data.confidence },
    };
  } catch (err) {
    log.warn(`OCR failed for ${localPath}, returning empty text: ${err}`);
    return { rawText: '', wordCount: 0, charCount: 0 };
  }
}

// ── Spreadsheet Extraction ──────────────────────────────────
async function extractSpreadsheet(localPath: string): Promise<ExtractedContent> {
  // For CSV, read as text. For xlsx, we'd need a library like xlsx.
  const ext = path.extname(localPath).toLowerCase();
  if (ext === '.csv') {
    return extractText(localPath);
  }
  log.warn(`Spreadsheet extraction for ${ext} not fully implemented; reading as text`);
  return extractText(localPath);
}
