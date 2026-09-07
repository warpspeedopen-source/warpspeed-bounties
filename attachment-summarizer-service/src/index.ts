import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { Storage } from '@google-cloud/storage';
import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';
import { Extractor } from './extractor';
import { LLMService } from './llm';

const prisma = new PrismaClient();

const sqs = new SQSClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const storage = new Storage({
  projectId: env.GCS_PROJECT_ID,
  credentials: {
    client_email: env.GCS_CLIENT_EMAIL,
    private_key: env.GCS_PRIVATE_KEY,
  },
});

async function processMessage(message: any) {
  logger.info(`Processing message ${message.MessageId}`);
  
  // Create an initial record
  let record = await prisma.attachmentRecord.upsert({
    where: { messageId: message.MessageId },
    update: {},
    create: {
      messageId: message.MessageId,
      bucketName: '',
      objectKey: '',
      status: 'PENDING',
    }
  });

  if (record.status === 'COMPLETED') {
    logger.info(`Message ${message.MessageId} already processed. Skipping.`);
    return;
  }

  try {
    const body = JSON.parse(message.Body || '{}');
    const bucketName = body.bucketName;
    const objectKey = body.objectKey;
    const mimeType = body.mimeType || 'application/octet-stream';

    if (!bucketName || !objectKey) {
      throw new Error('Missing bucketName or objectKey in SQS message body');
    }

    record = await prisma.attachmentRecord.update({
      where: { id: record.id },
      data: { bucketName, objectKey, status: 'PROCESSING' }
    });

    logger.info(`Downloading gs://${bucketName}/${objectKey}`);
    const file = storage.bucket(bucketName).file(objectKey);
    const [buffer] = await file.download();

    const extractionResult = await Extractor.extract(mimeType, buffer);
    let summary = '';

    if (extractionResult.isImage && extractionResult.text) {
      summary = await LLMService.summarizeImage(extractionResult.text);
    } else if (!extractionResult.isImage && extractionResult.text) {
      summary = await LLMService.summarizeText(extractionResult.text);
    }

    await prisma.attachmentRecord.update({
      where: { id: record.id },
      data: { 
        status: 'COMPLETED', 
        extractedText: extractionResult.isImage ? undefined : extractionResult.text,
        summary 
      }
    });

    logger.info(`Successfully processed message ${message.MessageId}`);
  } catch (error: any) {
    logger.error(`Error processing message ${message.MessageId}: ${error.message}`);
    await prisma.attachmentRecord.update({
      where: { id: record.id },
      data: { status: 'FAILED', error: error.message }
    });
    throw error;
  }
}

async function startPolling() {
  logger.info('Starting SQS polling...');
  
  while (true) {
    try {
      const response = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20, // Long polling
      }));

      if (response.Messages && response.Messages.length > 0) {
        for (const message of response.Messages) {
          try {
            await processMessage(message);
            
            // Delete message after successful processing or permanent failure handling
            await sqs.send(new DeleteMessageCommand({
              QueueUrl: env.SQS_QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle,
            }));
            logger.info(`Deleted message ${message.MessageId} from queue`);
          } catch (e) {
            logger.error(`Message ${message.MessageId} processing threw error, not deleting yet.`);
          }
        }
      }
    } catch (error: any) {
      logger.error(`Error polling SQS: ${error.message}`);
      // Sleep briefly before retrying to prevent tight loop on auth errors
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the app
startPolling();
