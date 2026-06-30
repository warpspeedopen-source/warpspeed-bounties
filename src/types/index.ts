export interface SQSMessage {
  messageId: string;
  receiptHandle: string;
  body: string;
  attributes: Record<string, string>;
}

export interface AttachmentEvent {
  id: string;
  userId: string;
  emailId: string;
  attachmentId: string;
  filename: string;
  contentType: string;
  gcsBucket: string;
  gcsPath: string;
  createdAt: string;
}

export interface SummaryResult {
  attachmentId: string;
  summary: string;
  wordCount: number;
  processingTimeMs: number;
}