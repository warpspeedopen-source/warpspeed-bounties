/**
 * Entry point. Wires the SQS consumer to the extract → summarize →
 * persist pipeline and installs graceful-shutdown signal handlers.
 */

import { PrismaClient } from "@prisma/client";
import { loadConfig } from "./config.js";
import { createLogger, logger as rootLogger } from "./logger.js";
import { GcsDownloader, withDownloadedFile } from "./gcs.js";
import { extractBuffer, extractFile } from "./extractors.js";
import { Summarizer } from "./summarizer.js";
import { SqsConsumer } from "./sqs.js";
import type { AttachmentEvent, SummaryStatus } from "./types.js";

const prisma = new PrismaClient();

/**
 * Persist a Summary row. If a row already exists for this messageId
 * (SQS delivered twice), update it instead of failing.
 */
async function upsertSummary(args: {
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  contentHash: string;
  status: SummaryStatus;
  originalText?: string;
  summary?: string;
  error?: string;
}): Promise<void> {
  await prisma.summary.upsert({
    where: { messageId: args.messageId },
    create: {
      messageId: args.messageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      contentHash: args.contentHash,
      status: args.status,
      originalText: args.originalText,
      summary: args.summary,
      error: args.error,
    },
    update: {
      status: args.status,
      originalText: args.originalText,
      summary: args.summary,
      error: args.error,
      contentHash: args.contentHash,
      fileSize: args.fileSize,
    },
  });
}

/**
 * Single end-to-end pipeline:
 *   1. Mark row DOWNLOADING, fetch bytes from GCS.
 *   2. Mark row EXTRACTING, run file extractor.
 *   3. Mark row SUMMARIZING, call Ollama.
 *   4. Mark row COMPLETED with the summary.
 */
export async function processEvent(event: AttachmentEvent): Promise<void> {
  const log = createLogger(event.messageId);
  const cfg = loadConfig();

  await upsertSummary({
    messageId: event.messageId,
    fileName: event.fileName,
    fileType: event.fileType,
    fileSize: event.fileSize,
    contentHash: event.contentHash ?? "",
    status: "DOWNLOADING",
  });

  const downloader = new GcsDownloader({
    bucket: cfg.GCS_BUCKET,
    tempDir: cfg.TEMP_DIR,
    logger: log,
  });

  let downloadedPath: string;
  let downloadedSize: number;
  try {
    const dl = await withDownloadedFile(
      downloader,
      event.gcsUrl,
      event.fileName,
      async (p) => {
        return { path: p, size: 0 };
      },
    );
    downloadedPath = dl.path;
    downloadedSize = dl.size;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("Download failed", { error: msg });
    await upsertSummary({
      messageId: event.messageId,
      fileName: event.fileName,
      fileType: event.fileType,
      fileSize: event.fileSize,
      contentHash: event.contentHash ?? "",
      status: "FAILED",
      error: msg,
    });
    throw err;
  }

  let extracted: { text: string; contentHash: string; detectedType: string };
  try {
    log.info("Extracting", { fileName: event.fileName });
    extracted = await extractFile(downloadedPath, event.fileName, event.fileType);
    await upsertSummary({
      messageId: event.messageId,
      fileName: event.fileName,
      fileType: event.fileType,
      fileSize: downloadedSize,
      contentHash: extracted.contentHash,
      status: "SUMMARIZING",
      originalText: extracted.text.slice(0, cfg.MAX_EXTRACTED_CHARS),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("Extraction failed", { error: msg });
    await upsertSummary({
      messageId: event.messageId,
      fileName: event.fileName,
      fileType: event.fileType,
      fileSize: downloadedSize,
      contentHash: event.contentHash ?? "",
      status: "FAILED",
      error: msg,
    });
    throw err;
  }

  try {
    const summarizer = new Summarizer({
      baseUrl: cfg.OLLAMA_URL,
      model: cfg.OLLAMA_MODEL,
      maxChars: cfg.MAX_EXTRACTED_CHARS,
      logger: log,
    });
    const result = await summarizer.summarize(extracted.text);
    log.info("Summarized", { tokens: result.tokensUsed, model: result.model });
    await upsertSummary({
      messageId: event.messageId,
      fileName: event.fileName,
      fileType: event.fileType,
      fileSize: downloadedSize,
      contentHash: extracted.contentHash,
      status: "COMPLETED",
      originalText: extracted.text.slice(0, cfg.MAX_EXTRACTED_CHARS),
      summary: result.summary,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("Summarization failed", { error: msg });
    await upsertSummary({
      messageId: event.messageId,
      fileName: event.fileName,
      fileType: event.fileType,
      fileSize: downloadedSize,
      contentHash: extracted.contentHash,
      status: "FAILED",
      error: msg,
    });
    throw err;
  }
}

async function main(): Promise<void> {
  const cfg = loadConfig();
  const log = rootLogger;

  log.info("Starting attachment-summarizer", {
    queue: cfg.SQS_QUEUE_URL,
    bucket: cfg.GCS_BUCKET,
    model: cfg.OLLAMA_MODEL,
  });

  // Best-effort: generate the Prisma client on first start.
  // Skipped silently if migrations haven't run yet — the consumer
  // still surfaces the failure clearly per-message.
  try {
    await prisma.$connect();
  } catch (err) {
    log.error("Prisma connection failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }

  const ac = new AbortController();
  const consumer = new SqsConsumer({
    config: cfg,
    processor: processEvent,
    logger: log,
    signal: ac.signal,
  });

  const shutdown = async (signal: string): Promise<void> => {
    log.info("Shutdown signal received", { signal });
    ac.abort();
    try {
      await prisma.$disconnect();
    } catch (err) {
      log.warn("Prisma disconnect error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  await consumer.run();
}

// Run main() unless this module is imported by tests.
const isMainModule = (() => {
  try {
    // import.meta.url resolves to this file's path.
    const url = new URL(import.meta.url);
    return url.pathname === process.argv[1];
  } catch {
    return false;
  }
})();

if (isMainModule) {
  main().catch((err) => {
    rootLogger.error("Fatal error", {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  });
}

export { prisma, extractBuffer };