import * as fs from 'fs';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as xlsx from 'xlsx';
import * as cheerio from 'cheerio';
import Tesseract from 'tesseract.js';

export async function extractText(filePath: string, mimeType: string): Promise<string> {
  const ext = filePath.split('.').pop()?.toLowerCase();

  // PDF
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }
  
  // Word
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  
  // Excel
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || ext === 'xlsx') {
    const workbook = xlsx.readFile(filePath);
    let text = '';
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      text += xlsx.utils.sheet_to_csv(sheet) + '\n';
    }
    return text;
  }

  // HTML
  if (mimeType === 'text/html' || ext === 'html' || ext === 'htm') {
    const html = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(html);
    return $('body').text();
  }

  // Plain Text
  if (mimeType === 'text/plain' || ext === 'txt' || ext === 'csv') {
    return fs.readFileSync(filePath, 'utf-8');
  }

  // Images
  if (mimeType.startsWith('image/')) {
    const result = await Tesseract.recognize(filePath, 'eng');
    return result.data.text;
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}
