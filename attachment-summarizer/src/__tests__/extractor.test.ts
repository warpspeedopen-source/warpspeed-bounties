import { extractText } from '../extractor';
import * as fs from 'fs';

jest.mock('fs');

describe('Extractor', () => {
  it('should extract plain text', async () => {
    (fs.readFileSync as jest.Mock).mockReturnValue('Hello text');
    const result = await extractText('test.txt', 'text/plain');
    expect(result).toBe('Hello text');
  });

  it('should throw on unsupported type', async () => {
    await expect(extractText('test.bin', 'application/octet-stream')).rejects.toThrow('Unsupported file type');
  });
});
