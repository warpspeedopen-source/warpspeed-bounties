export interface AttachmentEvent {
  messageId: string;
  receiptHandle: string;
  body: {
    attachmentId: string;
    filename: string;
    gcsUrl: string;
    contentType: string;
    userId: string;
    emailId: string;
  };
}

export interface AttachmentSummary {
  id: string;
  attachmentId: string;
  content: string;
  summary: string;
  contentType: string;
  wordCount: number;
  summaryLength: number;
  createdAt: Date;
  updatedAt: Date;
}