import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import xlsx from 'xlsx';

export async function extractContent(buffer: Buffer, mimeType: string): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      const pdfData = await pdf(buffer);
      return pdfData.text;
      
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      const docxResult = await mammoth.extractRawText({ buffer });
      return docxResult.value;
      
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
    case 'text/csv':
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      let text = '';
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        text += xlsx.utils.sheet_to_csv(sheet) + '\n';
      }
      return text;
      
    case 'text/plain':
    case 'text/html':
      return buffer.toString('utf-8');
      
    default:
      return '';
  }
}