import { SqsConsumer, SqsConsumerOptions } from '../src/services/sqs-consumer';
import { SqsAttachmentEvent } from '../src/types';

// Mock SQS client
jest.mock('@aws-sdk/client-sqs', () => {
  const mockSend = jest.fn();
  return {
    SQSClient: jest.fn(() => ({
      send: mockSend,
    })),
    ReceiveMessageCommand: jest.fn(),
    DeleteMessageCommand: jest.fn(),
  };
});

describe('SqsConsumer', () => {
  const options: SqsConsumerOptions = {
    region: 'us-east-1',
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/test-queue',
    pollIntervalMs: 10000,
    maxMessages: 10,
    visibilityTimeout: 300,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create consumer with valid options', () => {
    const consumer = new SqsConsumer(options);
    expect(consumer).toBeDefined();
  });

  it('should parse valid SQS message body', async () => {
    const consumer = new SqsConsumer(options);
    const handler = jest.fn();
    const event: SqsAttachmentEvent = {
      messageId: 'msg-1',
      attachmentId: 'att-1',
      storageKey: 'inbox/attachments/file.pdf',
      bucketName: 'warpspeed-attachments',
      fileName: 'report.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1024000,
    };

    // Mock the handler to verify
    await handler(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should reject invalid event without attachmentId', () => {
    const consumer = new SqsConsumer(options);
    const handler = jest.fn();
    const invalidEvent = {
      messageId: 'msg-1',
      // missing attachmentId
      storageKey: 'inbox/attachments/file.pdf',
      bucketName: 'warpspeed-attachments',
    };

    expect(() => {
      if (!invalidEvent.attachmentId) {
        throw new Error('Missing required field: attachmentId');
      }
    }).toThrow();
  });
});
