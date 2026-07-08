export interface AttachmentEvent {
  messageId: string;
  emailId: string;
  attachmentId: string;
  bucketName: string;
  objectPath: string;
  fileName: string;
  contentType: string;
  timestamp: string;
}

export interface ExtractionResult {
  text: string;
  metadata: Record<string, unknown>;
}

export interface SummaryResult {
  attachmentId: string;
  summary: string;
  metadata: Record<string, unknown>;
}
