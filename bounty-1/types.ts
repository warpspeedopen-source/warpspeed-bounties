export const SupportedFileType = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TXT: 'text/plain',
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  TIFF: 'image/tiff',
} as const;

export type SupportedFileType =
  (typeof SupportedFileType)[keyof typeof SupportedFileType];

export interface AttachmentEvent {
  messageId: string;
  attachmentId: string;
  gcsUri: string;
  fileName: string;
  mimeType: SupportedFileType;
  receivedAt: string;
}

export interface ExtractionResult {
  attachmentId: string;
  text: string;
  mimeType: SupportedFileType;
  pageCount?: number;
  wordCount: number;
  charCount: number;
  extractedAt: string;
}

export interface Summary {
  id: string;
  attachmentId: string;
  summary: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  createdAt: string;
}

export interface ProcessingResult {
  attachment: AttachmentEvent;
  extraction: ExtractionResult;
  summary: Summary;
}

export interface SqsMessage {
  messageId: string;
  receiptHandle: string;
  body: string;
  attributes: Record<string, string>;
}
