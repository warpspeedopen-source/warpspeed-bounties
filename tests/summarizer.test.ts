import { extractText } from '../src/services/fileProcessor.service';
import { generateSummary } from '../src/services/ollama.service';

jest.mock('../src/services/ollama.service');

describe('Attachment Summarizer', () => {
  test('PDF text extraction', async () => {
    const text = await extractText(Buffer.from('test pdf content'), 'application/pdf');
    expect(text).toContain('test pdf content');
  });

  test('Summary generation', async () => {
    (generateSummary as jest.Mock).mockResolvedValue('Test summary');
    const summary = await generateSummary('Long test document');
    expect(summary).toBe('Test summary');
  });
});
