import { categorizeAttachment, AttachmentCategory } from '../src/extractors/contentExtractor';
import type { AttachmentEvent } from '../src/models/types';

function makeEvent(overrides: Partial<AttachmentEvent> = {}): AttachmentEvent {
  return {
    eventId: 'test-event-1',
    sourceUrl: 'https://example.com/file.pdf',
    fileName: 'file.pdf',
    mimeType: 'application/pdf',
    ...overrides,
  };
}

describe('categorizeAttachment', () => {
  it('categorizes PDF by MIME type', () => {
    const event = makeEvent({ mimeType: 'application/pdf' });
    expect(categorizeAttachment(event)).toBe(AttachmentCategory.PDF);
  });

  it('categorizes PDF by file extension', () => {
    const event = makeEvent({ fileName: 'report.pdf', mimeType: 'application/octet-stream' });
    expect(categorizeAttachment(event)).toBe(AttachmentCategory.PDF);
  });

  it('categorizes DOCX by MIME type', () => {
    const event = makeEvent({
      fileName: 'doc.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(categorizeAttachment(event)).toBe(AttachmentCategory.DOCX);
  });

  it('categorizes plain text by MIME type', () => {
    const event = makeEvent({ fileName: 'readme.txt', mimeType: 'text/plain' });
    expect(categorizeAttachment(event)).toBe(AttachmentCategory.TEXT);
  });

  it('categorizes HTML by extension', () => {
    const event = makeEvent({ fileName: 'page.html', mimeType: 'text/html' });
    expect(categorizeAttachment(event)).toBe(AttachmentCategory.HTML);
  });

  it('categorizes images by extension', () => {
    const png = makeEvent({ fileName: 'photo.png', mimeType: 'image/png' });
    const jpg = makeEvent({ fileName: 'photo.jpg', mimeType: 'image/jpeg' });
    const gif = makeEvent({ fileName: 'anim.gif', mimeType: 'image/gif' });
    expect(categorizeAttachment(png)).toBe(AttachmentCategory.IMAGE);
    expect(categorizeAttachment(jpg)).toBe(AttachmentCategory.IMAGE);
    expect(categorizeAttachment(gif)).toBe(AttachmentCategory.IMAGE);
  });

  it('categorizes CSV as spreadsheet', () => {
    const event = makeEvent({ fileName: 'data.csv', mimeType: 'text/csv' });
    expect(categorizeAttachment(event)).toBe(AttachmentCategory.SPREADSHEET);
  });

  it('categorizes unknown types as UNKNOWN', () => {
    const event = makeEvent({ fileName: 'binary.bin', mimeType: 'application/octet-stream' });
    expect(categorizeAttachment(event)).toBe(AttachmentCategory.UNKNOWN);
  });

  it('categorizes markdown as text', () => {
    const event = makeEvent({ fileName: 'readme.md', mimeType: 'text/markdown' });
    expect(categorizeAttachment(event)).toBe(AttachmentCategory.TEXT);
  });

  it('categorizes JSON as text', () => {
    const event = makeEvent({ fileName: 'data.json', mimeType: 'application/json' });
    expect(categorizeAttachment(event)).toBe(AttachmentCategory.TEXT);
  });
});
