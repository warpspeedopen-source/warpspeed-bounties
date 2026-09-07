/**
 * Tests for the SQS consumer. The AWS SDK client is stubbed so we
 * never make a real network call.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseAttachmentMessage,
  SqsConsumer,
  type Processor,
  type SqsMessage,
} from "../src/sqs.js";
import type { Config } from "../src/config.js";
import type { AttachmentEvent, Logger } from "../src/types.js";

const makeLogger = (): Logger => ({
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  child: () => makeLogger(),
});

const baseConfig: Config = {
  SQS_QUEUE_URL: "https://sqs.example/test",
  GCS_BUCKET: "bucket",
  DATABASE_URL: "file:./dev.db",
  OLLAMA_URL: "http://localhost:11434",
  OLLAMA_MODEL: "llama3",
  AWS_REGION: "us-east-1",
  POLL_INTERVAL_MS: 1000,
  POLL_WAIT_SECONDS: 0,
  POLL_VISIBILITY_TIMEOUT: 60,
  MAX_FILE_SIZE: 1024,
  MAX_EXTRACTED_CHARS: 1000,
  TEMP_DIR: "/tmp",
  LOG_LEVEL: "info",
};

test("parseAttachmentMessage: valid payload", () => {
  const event: AttachmentEvent = {
    messageId: "m1",
    gcsUrl: "gs://bucket/key",
    fileName: "doc.pdf",
    fileType: "application/pdf",
    fileSize: 1234,
  };
  const result = parseAttachmentMessage(JSON.stringify(event));
  assert.ok(result);
  assert.equal(result?.event.messageId, "m1");
  assert.equal(result?.requestId, "m1");
});

test("parseAttachmentMessage: SNS-wrapped payload", () => {
  const event: AttachmentEvent = {
    messageId: "m2",
    gcsUrl: "gs://b/k",
    fileName: "f.txt",
    fileType: "text/plain",
    fileSize: 0,
  };
  const wrapped = JSON.stringify({ Message: JSON.stringify(event) });
  const result = parseAttachmentMessage(wrapped);
  assert.ok(result);
  assert.equal(result?.event.messageId, "m2");
});

test("parseAttachmentMessage: missing required field returns null", () => {
  const result = parseAttachmentMessage(JSON.stringify({ messageId: "m3" }));
  assert.equal(result, null);
});

test("parseAttachmentMessage: invalid JSON returns null", () => {
  const result = parseAttachmentMessage("not-json");
  assert.equal(result, null);
});

test("SqsConsumer: pollOnce invokes processor for valid messages", async () => {
  const { SQSClient } = await import("@aws-sdk/client-sqs");
  const event: AttachmentEvent = {
    messageId: "msg-1",
    gcsUrl: "gs://b/k",
    fileName: "f.txt",
    fileType: "text/plain",
    fileSize: 0,
  };

  const seen: string[] = [];
  const processor: Processor = async (e) => {
    seen.push(e.messageId);
  };

  const original = SQSClient.prototype.send;
  SQSClient.prototype.send = async function () {
    return {
      Messages: [
        { MessageId: "1", Body: JSON.stringify(event), ReceiptHandle: "rh-1" } as SqsMessage,
      ],
    };
  } as typeof SQSClient.prototype.send;

  try {
    const consumer = new SqsConsumer({
      config: baseConfig,
      processor,
      logger: makeLogger(),
    });
    await consumer.pollOnce();
    assert.deepEqual(seen, ["msg-1"]);
  } finally {
    SQSClient.prototype.send = original;
  }
});

test("SqsConsumer: pollOnce deletes unparseable messages", async () => {
  const { SQSClient, DeleteMessageCommand } = await import("@aws-sdk/client-sqs");
  const original = SQSClient.prototype.send;
  let deleteCalled = false;
  SQSClient.prototype.send = async function (
    command: unknown,
  ) {
    // Identify delete calls by command class name.
    const name =
      command && typeof command === "object"
        ? (command as { constructor?: { name?: string } }).constructor?.name
        : undefined;
    if (name === "DeleteMessageCommand") {
      deleteCalled = true;
      return {};
    }
    return {
      Messages: [{ MessageId: "x", Body: "not-json", ReceiptHandle: "rh-x" }],
    };
  } as typeof SQSClient.prototype.send;
  void DeleteMessageCommand;

  try {
    const consumer = new SqsConsumer({
      config: baseConfig,
      processor: async () => undefined,
      logger: makeLogger(),
    });
    await consumer.pollOnce();
    assert.equal(deleteCalled, true);
  } finally {
    SQSClient.prototype.send = original;
  }
});