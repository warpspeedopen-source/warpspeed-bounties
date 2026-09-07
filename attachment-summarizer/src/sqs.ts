/**
 * SQS event consumer. Long-polls an SQS queue, parses each message
 * as an AttachmentEvent, and hands it off to the supplied processor.
 */

import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  type ReceiveMessageCommandInput,
} from "@aws-sdk/client-sqs";
import type { AttachmentEvent, Logger } from "./types.js";
import type { Config } from "./config.js";
import { createLogger } from "./logger.js";
import { z } from "zod";

const AttachmentEventSchema = z.object({
  messageId: z.string().min(1),
  gcsUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  contentHash: z.string().optional(),
  createdAt: z.string().optional(),
});

/**
 * Process a single AttachmentEvent. Implementations should be
 * idempotent — the same event may be delivered more than once.
 */
export type Processor = (
  event: AttachmentEvent,
  logger: Logger,
) => Promise<void>;

/**
 * Generic SQS message shape we care about.
 */
export interface SqsMessage {
  MessageId?: string;
  Body?: string;
  ReceiptHandle?: string;
}

/**
 * Parse + validate a raw SQS message body into an AttachmentEvent.
 * Returns null if the body cannot be parsed.
 */
export function parseAttachmentMessage(
  raw: string,
): { event: AttachmentEvent; requestId: string } | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    let candidate: unknown = parsed;
    // SQS sometimes wraps payloads in { "Message": "..." } (SNS-shaped).
    if (
      candidate &&
      typeof candidate === "object" &&
      "Message" in (candidate as Record<string, unknown>)
    ) {
      const inner = (candidate as Record<string, unknown>).Message;
      if (typeof inner === "string") {
        candidate = JSON.parse(inner);
      }
    }
    const result = AttachmentEventSchema.safeParse(candidate);
    if (!result.success) {
      return null;
    }
    return { event: result.data, requestId: result.data.messageId };
  } catch {
    return null;
  }
}

export interface SqsConsumerOptions {
  config: Config;
  processor: Processor;
  logger: Logger;
  /** When true the consumer stops looping and resolves its run() promise. */
  signal?: AbortSignal;
}

/**
 * Long-running SQS consumer loop. Returns when the AbortSignal fires.
 */
export class SqsConsumer {
  private readonly client: SQSClient;
  private readonly opts: SqsConsumerOptions;
  private readonly logger: Logger;
  private readonly queueUrl: string;
  private readonly waitSeconds: number;
  private readonly visibilityTimeout: number;
  private running = false;

  constructor(opts: SqsConsumerOptions) {
    this.opts = opts;
    this.logger = opts.logger;
    this.queueUrl = opts.config.SQS_QUEUE_URL;
    this.waitSeconds = opts.config.POLL_WAIT_SECONDS;
    this.visibilityTimeout = opts.config.POLL_VISIBILITY_TIMEOUT;

    const clientConfig: { region: string; endpoint?: string } = {
      region: opts.config.AWS_REGION,
    };
    if (opts.config.AWS_ENDPOINT_URL) {
      clientConfig.endpoint = opts.config.AWS_ENDPOINT_URL;
    }
    this.client = new SQSClient(clientConfig);
  }

  /**
   * Run the consumer loop until the abort signal fires.
   */
  async run(): Promise<void> {
    if (this.running) {
      throw new Error("SqsConsumer.run() called twice");
    }
    this.running = true;
    this.logger.info("SQS consumer starting", {
      queue: this.queueUrl,
      waitSeconds: this.waitSeconds,
    });

    while (!this.opts.signal?.aborted) {
      try {
        await this.pollOnce();
      } catch (err) {
        this.logger.error("SQS poll iteration failed", {
          error: err instanceof Error ? err.message : String(err),
        });
        // Back off briefly before retrying so we don't spin hot on
        // persistent failures (e.g. SQS throttling).
        await sleep(Math.min(5_000, this.opts.config.POLL_INTERVAL_MS));
      }
    }
    this.running = false;
    this.logger.info("SQS consumer stopped");
  }

  /**
   * Run a single poll iteration — exposed so tests can drive it directly.
   */
  async pollOnce(): Promise<void> {
    const input: ReceiveMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: this.waitSeconds,
      VisibilityTimeout: this.visibilityTimeout,
      MessageAttributeNames: ["All"],
      AttributeNames: ["All"],
    };
    const cmd = new ReceiveMessageCommand(input);
    const result = await this.client.send(cmd);
    const messages = result.Messages ?? [];
    if (messages.length === 0) return;

    await Promise.all(
      messages.map((m) => this.handleMessage(m as SqsMessage)),
    );
  }

  private async handleMessage(msg: SqsMessage): Promise<void> {
    const body = msg.Body ?? "";
    const parsed = parseAttachmentMessage(body);
    if (!parsed) {
      this.logger.error("Unparseable message; deleting", {
        messageId: msg.MessageId,
      });
      await this.safeDelete(msg);
      return;
    }

    const childLogger = createLogger(parsed.requestId);
    childLogger.info("SQS message received", {
      messageId: parsed.event.messageId,
      fileName: parsed.event.fileName,
    });

    try {
      await this.opts.processor(parsed.event, childLogger);
      await this.safeDelete(msg);
    } catch (err) {
      childLogger.error("Processor failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      // Do not delete — let SQS retry / DLQ policy handle it.
    }
  }

  private async safeDelete(msg: SqsMessage): Promise<void> {
    if (!msg.ReceiptHandle || !this.queueUrl) return;
    try {
      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl: this.queueUrl,
          ReceiptHandle: msg.ReceiptHandle,
        }),
      );
    } catch (err) {
      this.logger.warn("Failed to delete SQS message", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}