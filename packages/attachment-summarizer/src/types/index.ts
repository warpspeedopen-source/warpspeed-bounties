export interface SqsAttachmentEvent {
  messageId: string;
  attachmentId: string;
  storageKey: string;
  bucketName: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface SummaryResult {
  attachmentId: string;
  summary: string;
  model: string;
  processingTimeMs: number;
}

export interface ExtractedContent {
  attachmentId: string;
  text: string;
  contentType: string;
  metadata?: Record<string, unknown>;
}

export type SupportedMimeType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.ms-excel'
  | 'text/plain'
  | 'text/html'
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp';

export const SUPPORTED_MIME_TYPES: SupportedMimeType[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/plain',
  'text/html',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export interface AppConfig {
  aws: {
    region: string;
    sqsQueueUrl: string;
    sqsPollIntervalMs: number;
    sqsMaxMessages: number;
    sqsVisibilityTimeout: number;
  };
  gcs: {
    serviceAccountKey: string;
  };
  ollama: {
    baseUrl: string;
    model: string;
    timeoutMs: number;
  };
  redis: {
    host: string;
    port: number;
  };
  database: {
    url: string;
  };
  processing: {
    maxFileSizeBytes: number;
    tempDir: string;
    maxConcurrentJobs: number;
  };
}
