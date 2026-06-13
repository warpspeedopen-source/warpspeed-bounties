import fs from 'fs';
import path from 'path';

async function extractPDF(filePath: string): Promise<string> {
  const pdf = require('pdf-parse');
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

async function extractDOCX(filePath: string): Promise<string> {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

async function extractXLSX(filePath: string): Promise<string> {
  const XLSX = require('xlsx');
  const workbook = XLSX.readFile(filePath);
  let text = '';
  workbook.SheetNames.forEach((name: string) => {
    const sheet = workbook.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    text += csv + '\n';
  });
  return text;
}

async function extractImage(filePath: string): Promise<string> {
  const Tesseract = require('tesseract.js');
  const { data } = await Tesseract.recognize(filePath, 'eng', {
    logger: (m: any) => {},
  });
  return data.text;
}

async function extractHTML(filePath: string): Promise<string> {
  const cheerio = require('cheerio');
  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);
  return $('body').text();
}

async function extractTXT(filePath: string): Promise<string> {
  return fs.readFileSync(filePath, 'utf-8');
}

export async function extractText(filePath: string, objectName: string): Promise<string> {
  const ext = path.extname(objectName).toLowerCase();
  switch (ext) {
    case '.pdf':
      return extractPDF(filePath);
    case '.docx':
      return extractDOCX(filePath);
    case '.xlsx':
      return extractXLSX(filePath);
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
    case '.bmp':
    case '.tiff':
      return extractImage(filePath);
    case '.html':
    case '.htm':
      return extractHTML(filePath);
    case '.txt':
    case '.csv':
      return extractTXT(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}