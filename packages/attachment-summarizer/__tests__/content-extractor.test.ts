import { ContentExtractor } from '../src/services/content-extractor';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock external libraries
jest.mock('pdf-parse', () => jest.fn(() => Promise.resolve({ text: 'Mock PDF content' })));
jest.mock('mammoth', () => ({
  extractRawText: jest.fn(() => Promise.resolve({ value: 'Mock Word content' })),
}));
jest.mock('xlsx', () => ({
  readFile: jest.fn(() => ({
    SheetNames: ['Sheet1'],
    Sheets: {
      Sheet1: {},
    },
  })),
  utils: {
    sheet_to_csv: jest.fn(() => 'col1,col2\nval1,val2'),
  },
}));

// Mock fs
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

describe('ContentExtractor', () => {
  let extractor: ContentExtractor;

  beforeEach(() => {
    extractor = new ContentExtractor();
    jest.clearAllMocks();
  });

  it('should support known MIME types', () => {
    expect(extractor.isSupported('application/pdf')).toBe(true);
    expect(extractor.isSupported('text/plain')).toBe(true);
    expect(extractor.isSupported('image/jpeg')).toBe(true);
    expect(extractor.isSupported('text/html')).toBe(true);
    expect(extractor.isSupported('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
  });

  it('should reject unsupported MIME types', () => {
    expect(extractor.isSupported('video/mp4')).toBe(false);
    expect(extractor.isSupported('audio/mpeg')).toBe(false);
  });

  it('should extract text from plain text files', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue('Hello World');
    const result = await extractor.extract('/tmp/test.txt', 'text/plain', 'att-1');
    expect(result.text).toBe('Hello World');
    expect(result.contentType).toBe('text');
  });

  it('should strip HTML tags', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue('<html><body><h1>Title</h1><p>Content</p></body></html>');
    const result = await extractor.extract('/tmp/test.html', 'text/html', 'att-2');
    expect(result.text).toContain('Title');
    expect(result.text).toContain('Content');
    expect(result.text).not.toContain('<html>');
  });
});
