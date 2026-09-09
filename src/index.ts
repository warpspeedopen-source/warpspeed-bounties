import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { PrismaClient } from '@prisma/client';
import { downloadFile } from './services/gcs.service';
import { extractText } from './services/fileProcessor.service';
import { generateSummary } from './services/ollama.service';

const sqs = new SQSClient({ region: process.env.AWS_REGION });
const prisma = new PrismaClient();
const queueUrl = process.env.SQS_QUEUE_URL!;

const processMessage = async (message: any) => {
  const { bucket, filePath, mimeType } = JSON.parse(message.Body);
  
  try {
    const buffer = await downloadFile(bucket, filePath);
    const text = await extractText(buffer, mimeType);
    const summary = await generateSummary(text.slice(0, 8000)); // LLM context limit
    
    await prisma.summary.create({
      data: { content: text, summary }
    });
    
    await sqs.send(new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: message.ReceiptHandle
    }));
  } catch (error) {
    console.error('Processing failed:', error);
    // Implement dead-letter queue logic
  }
};

const startConsumer = async () => {
  while (true) {
    const { Messages = [] } = await sqs.send(new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20
    }));
    
    await Promise.all(Messages.map(processMessage));
  }
};

startConsumer().catch(console.error);
