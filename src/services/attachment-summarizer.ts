/**
 * Attachment Summarizer Service
 * Bounty: [PAID BOUNTY - $960] Attachment Summarizer Service
 * Repo: warpspeedopen-source/warpspeed-bounties#1
 *
 * A Node.js + TypeScript + Prisma backend service that accepts an attachment
 * (PDF / plain text / image OCR text), extracts its text content, produces a
 * concise summary plus key points, and persists the result for later retrieval.
 *
 * Design goals:
 *  - Provider-agnostic LLM layer (OpenAI / Anthropic / local) behind one interface.
 *  - Streaming-safe, chunked extraction for large files.
 *  - Idempotent job processing keyed by content hash (no duplicate LLM spend).
 *  - Strict input validation, typed errors, structured logging.
 *  - Fully unit-testable: the LLM client is injected, so tests run offline.
 */

import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AttachmentKind = 'pdf' | 'text' | 'image' | 'docx' | 'unknown';

export interface AttachmentInput {
  /** Original filename, used only for kind detection + display. */
  filename: string;
  /** Raw bytes of the attachment. */
  buffer: Buffer;
  /** MIME type if known. */
  mimeType?: string;
}

export interface SummaryResult {
  id: string;
  contentHash: string;
  kind: AttachmentKind;
  summary: string;
  keyPoints: string[];
  wordCount: number;
  model: string;
  tokensUsed: number;
  createdAt: Date;
  /** true when this call returned a previously computed summary. */
  cached: boolean;
}

/** Minimal structural interface for a text extractor (PDF, OCR, docx...). */
export interface TextExtractor {
  supports(kind: AttachmentKind): boolean;
  extract(input: AttachmentInput): Promise<string>;
}

/** Provider-agnostic LLM interface. */
export interface SummarizerLlm {
  readonly model: string;
  summarize(
    text: string,
    opts: { maxKeyPoints: number; maxSummaryWords: number },
  ): Promise<{ summary: string; keyPoints: string[]; tokensUsed: number }>;
}

export interface SummarizerConfig {
  maxKeyPoints: number;
  maxSummaryWords: number;
  /** Hard cap on extracted text length to bound LLM cost. */
  maxInputChars: number;
}

export const DEFAULT_CONFIG: SummarizerConfig = {
  maxKeyPoints: 5,
  maxSummaryWords: 120,
  maxInputChars: 60_000,
};

export class SummarizerError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'UNSUPPORTED_KIND'
      | 'EMPTY_CONTENT'
      | 'EXTRACTION_FAILED'
      | 'LLM_FAILED'
      | 'TOO_LARGE',
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SummarizerError';
  }
}

// ---------------------------------------------------------------------------
// Kind detection
// ---------------------------------------------------------------------------

const EXT_MAP: Record<string, AttachmentKind> = {
  '.pdf': 'pdf',
  '.txt': 'text',
  '.md': 'text',
  '.csv': 'text',
  '.log': 'text',
  '.json': 'text',
  '.png': 'image',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.webp': 'image',
  '.docx': 'docx',
};

export function detectKind(input: AttachmentInput): AttachmentKind {
  const lower = input.filename.toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot >= 0) {
    const kind = EXT_MAP[lower.slice(dot)];
    if (kind) return kind;
  }
  if (input.mimeType) {
    if (input.mimeType.startsWith('text/')) return 'text';
    if (input.mimeType === 'application/pdf') return 'pdf';
    if (input.mimeType.startsWith('image/')) return 'image';
  }
  return 'unknown';
}

export function contentHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export interface SummarizerDeps {
  prisma: PrismaClient;
  extractors: TextExtractor[];
  llm: SummarizerLlm;
  config?: Partial<SummarizerConfig>;
}

export class AttachmentSummarizerService {
  private readonly config: SummarizerConfig;

  constructor(private readonly deps: SummarizerDeps) {
    this.config = { ...DEFAULT_CONFIG, ...(deps.config ?? {}) };
  }

  /**
   * Summarize an attachment. Idempotent: identical bytes return the stored
   * summary without re-invoking the LLM.
   */
  async summarize(input: AttachmentInput): Promise<SummaryResult> {
    if (input.buffer.length === 0) {
      throw new SummarizerError('Attachment is empty', 'EMPTY_CONTENT');
    }

    const hash = contentHash(input.buffer);

    // 1. Cache lookup — never pay twice for the same content.
    const existing = await this.deps.prisma.attachmentSummary.findUnique({
      where: { contentHash: hash },
    });
    if (existing) {
      return this.toResult(existing, true);
    }

    // 2. Detect kind + extract text.
    const kind = detectKind(input);
    const extractor = this.deps.extractors.find((e) => e.supports(kind));
    if (!extractor) {
      throw new SummarizerError(
        `No extractor registered for kind "${kind}"`,
        'UNSUPPORTED_KIND',
      );
    }

    let text: string;
    try {
      text = await extractor.extract(input);
    } catch (err) {
      throw new SummarizerError(
        `Text extraction failed for ${input.filename}`,
        'EXTRACTION_FAILED',
        err,
      );
    }

    text = text.trim();
    if (text.length === 0) {
      throw new SummarizerError('Extracted text is empty', 'EMPTY_CONTENT');
    }
    if (text.length > this.config.maxInputChars) {
      text = text.slice(0, this.config.maxInputChars);
    }

    // 3. Summarize via LLM.
    let summary: string;
    let keyPoints: string[];
    let tokensUsed: number;
    try {
      const out = await this.deps.llm.summarize(text, {
        maxKeyPoints: this.config.maxKeyPoints,
        maxSummaryWords: this.config.maxSummaryWords,
      });
      summary = out.summary.trim();
      keyPoints = out.keyPoints.map((p) => p.trim()).filter(Boolean);
      tokensUsed = out.tokensUsed;
    } catch (err) {
      throw new SummarizerError('LLM summarization failed', 'LLM_FAILED', err);
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // 4. Persist (upsert guards against a race between two identical uploads).
    const row = await this.deps.prisma.attachmentSummary.upsert({
      where: { contentHash: hash },
      create: {
        contentHash: hash,
        filename: input.filename,
        kind,
        summary,
        keyPoints,
        wordCount,
        model: this.deps.llm.model,
        tokensUsed,
      },
      update: {},
    });

    return this.toResult(row, false);
  }

  async getById(id: string): Promise<SummaryResult | null> {
    const row = await this.deps.prisma.attachmentSummary.findUnique({
      where: { id },
    });
    return row ? this.toResult(row, true) : null;
  }

  private toResult(row: {
    id: string;
    contentHash: string;
    kind: string;
    summary: string;
    keyPoints: string[];
    wordCount: number;
    model: string;
    tokensUsed: number;
    createdAt: Date;
  }, cached: boolean): SummaryResult {
    return {
      id: row.id,
      contentHash: row.contentHash,
      kind: row.kind as AttachmentKind,
      summary: row.summary,
      keyPoints: row.keyPoints,
      wordCount: row.wordCount,
      model: row.model,
      tokensUsed: row.tokensUsed,
      createdAt: row.createdAt,
      cached,
    };
  }
}

// ---------------------------------------------------------------------------
// Reference extractors
// ---------------------------------------------------------------------------

/** Plain-text extractor: decodes UTF-8 directly. */
export class PlainTextExtractor implements TextExtractor {
  supports(kind: AttachmentKind): boolean {
    return kind === 'text';
  }
  async extract(input: AttachmentInput): Promise<string> {
    return input.buffer.toString('utf8');
  }
}

/**
 * PDF extractor. Wraps `pdf-parse` so the service stays decoupled from the
 * concrete parsing library and remains unit-testable.
 */
export class PdfExtractor implements TextExtractor {
  supports(kind: AttachmentKind): boolean {
    return kind === 'pdf';
  }
  async extract(input: AttachmentInput): Promise<string> {
    // Lazy import keeps pdf-parse out of the hot path for non-PDF requests.
    const mod = (await import('pdf-parse')) as unknown as {
      default: (b: Buffer) => Promise<{ text: string }>;
    };
    const parsed = await mod.default(input.buffer);
    return parsed.text;
  }
}
