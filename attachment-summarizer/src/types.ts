/**
 * Core types for the attachment-summarizer service.
 */

export type SummaryStatus =
  | "PENDING"
  | "DOWNLOADING"
  | "EXTRACTING"
  | "SUMMARIZING"
  | "COMPLETED"
  | "FAILED";

/**
 * The event payload published to SQS when a new attachment
 * arrives and needs to be summarized.
 */
export interface AttachmentEvent {
  /** Unique identifier for the parent message / thread. */
  messageId: string;
  /** GCS object URL (gs://bucket/key) or HTTPS URL. */
  gcsUrl: string;
  /** Original filename including extension. */
  fileName: string;
  /** MIME type or extension hint (e.g. "application/pdf"). */
  fileType: string;
  /** File size in bytes. */
  fileSize: number;
  /** SHA-256 of the file contents (optional; computed if absent). */
  contentHash?: string;
  /** ISO-8601 timestamp when the event was published. */
  createdAt?: string;
}

/**
 * Result of running an extractor over a downloaded file.
 */
export interface ExtractResult {
  text: string;
  /** SHA-256 hex digest of the original file bytes. */
  contentHash: string;
  /** Detected / normalized mime type after extraction. */
  detectedType: string;
}

/**
 * Result of running the summarizer over extracted text.
 */
export interface SummaryResult {
  summary: string;
  /** Approximate number of tokens consumed by the LLM call. */
  tokensUsed?: number;
  /** Model identifier used. */
  model: string;
}

/**
 * Logger interface to allow tests to inject mock loggers.
 */
export interface Logger {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  debug: (msg: string, meta?: Record<string, unknown>) => void;
  child: (meta: Record<string, unknown>) => Logger;
}

/**
 * Helper to narrow file extension → kind for extractor dispatch.
 */
export type FileKind =
  | "pdf"
  | "docx"
  | "xlsx"
  | "csv"
  | "txt"
  | "html"
  | "image"
  | "unknown";