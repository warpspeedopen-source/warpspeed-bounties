import { PDFDocumentProxy } from 'pdf-parse';
import mammoth from 'mammoth';
import xlsx from 'xlsx';
import { createWorker } from 'tesseract.js';

const imageOCRWorker = createWorker({
  logger: (m) => console.log(m),
});

export const extractText = async (buffer: Buffer, mimeType: string): Promise<string> => {
  switch (mimeType) {
    case 'application/pdf':
      const { text } = await (require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>)(buffer);
      return text;

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      const { value } = await mammoth.extractRawText({ buffer });
      return value;

    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      return workbook.SheetNames.map(name => 
        xlsx.utils.sheet_to_csv(workbook.Sheets[name])
      ).join('\n');

    case 'text/plain':
    case 'text/html':
      return buffer.toString();

    case 'image/png':
    case 'image/jpeg':
      await imageOCRWorker.load();
      await imageOCRWorker.loadLanguage('eng');
      await imageOCRWorker.initialize('eng');
      const { data } = await imageOCRWorker.recognize(buffer);
      await imageOCRWorker.terminate();
      return data.text;

    default:
      throw new Error(`Unsupported MIME type: ${mimeType}`);
  }
};
