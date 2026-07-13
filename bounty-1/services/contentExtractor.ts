import { readFile } from 'fs/promises';
import path from 'path';
import { AttachmentEvent, ExtractionResult, SupportedFileType } from '../types';

let pdfParse: typeof import('pdf-parse') | null = null;
async function getPdfParse() {
  if (!pdfParse) {
    pdfParse = (await import('pdf-parse')).default;
  }
  return pdfParse;
}

let mammoth: typeof import('mammoth') | null = null;
async function getMammoth() {
  if (!mammoth) {
    mammoth = await import('mammoth');
  }
  return mammoth;
}

let Tesseract: typeof import('tesseract.js') | null = null;
async function getTesseract() {
  if (!Tesseract) {
    Tesseract = await import('tesseract.js');
  }
  return Tesseract;
}

async function extractPdf(filePath: string): Promise<string> {
  const parser = await getPdfParse();
  const dataBuffer = await readFile(filePath);
  const data = await parser(dataBuffer);
  return data.text;
}

async function extractDocx(filePath: string): Promise<string> {
  const m = await getMammoth();
  const buffer = await readFile(filePath);
  const result = await m.extractRawText({ buffer });
  return result.value;
}

async function extractTxt(filePath: string): Promise<string> {
  return await readFile(filePath, 'utf-8');
}

async function extractImage(filePath: string): Promise<string> {
  const t = await getTesseract();
  const result = await t.recognize(filePath, 'eng');
  return result.data.text;
}

function detectMimeType(filePath: string): SupportedFileType {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf':
      return SupportedFileType.PDF;
    case '.docx':
      return SupportedFileType.DOCX;
    case '.txt':
    case '.csv':
    case '.log':
    case '.md':
      return SupportedFileType.TXT;
    case '.jpg':
    case '.jpeg':
      return SupportedFileType.JPEG;
    case '.png':
      return SupportedFileType.PNG;
    case '.tif':
    case '.tiff':
      return SupportedFileType.TIFF;
    default:
      throw new Error(`Unsupported file extension: ${ext}`);
  }
}

export async function extractContent(
  filePath: string,
  event?: AttachmentEvent,
): Promise<ExtractionResult> {
  const mimeType = event?.mimeType ?? detectMimeType(filePath);

  let text: string;
  switch (mimeType) {
    case SupportedFileType.PDF:
      text = await extractPdf(filePath);
      break;
    case SupportedFileType.DOCX:
      text = await extractDocx(filePath);
      break;
    case SupportedFileType.TXT:
      text = await extractTxt(filePath);
      break;
    case SupportedFileType.JPEG:
    case SupportedFileType.PNG:
    case SupportedFileType.TIFF:
      text = await extractImage(filePath);
      break;
    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`);
  }

  const charCount = text.length;
  const wordCount = text
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    attachmentId: event?.attachmentId ?? 'unknown',
    text,
    mimeType,
    wordCount,
    charCount,
    extractedAt: new Date().toISOString(),
  };
}
