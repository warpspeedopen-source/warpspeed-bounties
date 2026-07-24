/** SQS event payload for attachment processing */
export interface AttachmentEvent {
  /** Unique event identifier */
  eventId: string;
  /** Direct download URL for the attachment */
  sourceUrl: string;
  /** GCS bucket name (if stored in GCS) */
  bucket?: string;
  /** GCS object path (if stored in GCS) */
  objectPath?: string;
  /** Original file name */
  fileName: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  fileSizeBytes?: number;
  /** Email thread or message ID this attachment belongs to */
  messageId?: string;
  /** Timestamp when the event was created */
  eventTimestamp?: string;
}

/** Supported attachment MIME type categories */
export enum AttachmentCategory {
  PDF = 'pdf',
  DOCX = 'docx',
  TEXT = 'text',
  HTML = 'html',
  IMAGE = 'image',
  SPREADSHEET = 'spreadsheet',
  UNKNOWN = 'unknown',
}

/** Extracted text content from an attachment */
export interface ExtractedContent {
  rawText: string;
  wordCount: number;
  charCount: number;
  pageCount?: number;
  language?: string;
  metadata?: Record<string, unknown>;
}

/** LLM-generated summary */
export interface SummaryResult {
  summaryText: string;
  modelUsed: string;
  tokensIn?: number;
  tokensOut?: number;
  confidence?: number;
}

/** Processing status for an attachment */
export type ProcessingStatus =
  | 'PENDING'
  | 'DOWNLOADING'
  | 'DOWNLOADED'
  | 'EXTRACTING'
  | 'EXTRACTED'
  | 'SUMMARIZING'
  | 'COMPLETED'
  | 'FAILED';

/** Health check response */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  checks: {
    sqs: boolean;
    gcs: boolean;
    ollama: boolean;
    redis: boolean;
    database: boolean;
  };
}
