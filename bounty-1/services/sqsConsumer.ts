import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  ChangeMessageVisibilityCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { AttachmentEvent, ProcessingResult, SqsMessage } from '../types';
import { downloadFromGcs } from './gcsDownloader';
import { extractContent } from './contentExtractor';
import { summarize } from './summarizer';
import { prisma } from '../lib/prisma';
import fs from 'fs/promises';

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL!;
const MAX_RETRIES = 3;
const VISIBILITY_TIMEOUT = 120;

const sqs = new SQSClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
});

function parseSqsMessage(msg: Message): SqsMessage {
  if (!msg.MessageId || !msg.ReceiptHandle || !msg.Body) {
    throw new Error('Invalid SQS message: missing required fields');
  }
  return {
    messageId: msg.MessageId,
    receiptHandle: msg.ReceiptHandle,
    body: msg.Body,
    attributes: msg.Attributes ?? {},
  };
}

function parseAttachmentEvent(sqsMsg: SqsMessage): AttachmentEvent {
  const parsed: Record<string, unknown> = JSON.parse(sqsMsg.body);
  if (
    typeof parsed.attachmentId !== 'string' ||
    typeof parsed.gcsUri !== 'string' ||
    typeof parsed.fileName !== 'string' ||
    typeof parsed.mimeType !== 'string' ||
    typeof parsed.receivedAt !== 'string'
  ) {
    throw new Error('Invalid AttachmentEvent: missing or wrong-typed fields');
  }
  return {
    messageId: sqsMsg.messageId,
    attachmentId: parsed.attachmentId,
    gcsUri: parsed.gcsUri,
    fileName: parsed.fileName,
    mimeType: parsed.mimeType as AttachmentEvent['mimeType'],
    receivedAt: parsed.receivedAt,
  };
}

async function processEvent(event: AttachmentEvent): Promise<ProcessingResult> {
  const filePath = await downloadFromGcs(event.gcsUri);
  try {
    const extraction = await extractContent(filePath, event);
    const summary = await summarize(extraction);
    await prisma.attachment.upsert({
      where: { attachmentId: event.attachmentId },
      update: {
        status: 'COMPLETED',
        extractedText: extraction.text,
        summaryText: summary.summary,
        summaryModel: summary.model,
        processedAt: new Date(),
      },
      create: {
        attachmentId: event.attachmentId,
        fileName: event.fileName,
        mimeType: event.mimeType,
        gcsUri: event.gcsUri,
        sqsMessageId: event.messageId,
        status: 'COMPLETED',
        extractedText: extraction.text,
        summaryText: summary.summary,
        summaryModel: summary.model,
        processedAt: new Date(),
      },
    });
    return { attachment: event, extraction, summary };
  } finally {
    await fs.promises.unlink(filePath).catch(() => {});
  }
}

export async function pollQueue(): Promise<void> {
  const command = new ReceiveMessageCommand({
    QueueUrl: SQS_QUEUE_URL,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20,
    VisibilityTimeout: VISIBILITY_TIMEOUT,
  });

  const response = await sqs.send(command);
  if (!response.Messages?.length) return;

  const results = await Promise.allSettled(
    response.Messages.map(async (msg) => {
      let attempts = 0;
      const sqsMsg = parseSqsMessage(msg);
      const event = parseAttachmentEvent(sqsMsg);

      while (attempts < MAX_RETRIES) {
        try {
          await processEvent(event);
          await sqs.send(
            new DeleteMessageCommand({
              QueueUrl: SQS_QUEUE_URL,
              ReceiptHandle: sqsMsg.receiptHandle,
            }),
          );
          return { messageId: sqsMsg.messageId, status: 'ok' };
        } catch (err) {
          attempts++;
          if (attempts >= MAX_RETRIES) {
            throw err;
          }
          await sqs.send(
            new ChangeMessageVisibilityCommand({
              QueueUrl: SQS_QUEUE_URL,
              ReceiptHandle: sqsMsg.receiptHandle,
              VisibilityTimeout: VISIBILITY_TIMEOUT * attempts,
            }),
          );
        }
      }
      return { messageId: sqsMsg.messageId, status: 'error' };
    }),
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('Fatal error processing batch:', result.reason);
    }
  }
}

export async function startConsumer(): Promise<void> {
  console.log('SQS consumer starting, polling:', SQS_QUEUE_URL);
  while (true) {
    try {
      await pollQueue();
    } catch (err) {
      console.error('Poll error, will retry in 10s:', err);
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
}
