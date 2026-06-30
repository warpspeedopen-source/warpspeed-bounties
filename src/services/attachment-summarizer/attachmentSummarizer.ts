import { SQS } from 'aws-sdk';
import { Storage } from '@google-cloud/storage';
import { Ollama } from 'ollama';
import winston from 'winston';
import { Attachment } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { AttachmentProcessor } from './attachmentProcessor';

export class AttachmentSummarizerService {
  private sqs: SQS;
  private storage: Storage;
  private ollama: Ollama;
  private prisma: PrismaClient;
  private logger: winston.Logger;
  
  constructor() {
    this.sqs = new SQS({ region: process.env.AWS_REGION });
    this.storage = new Storage({ projectId: process.env.GCP_PROJECT_ID });
    this.ollama = new Ollama({ host: process.env.OLLAMA_HOST });
    this.prisma = new PrismaClient();
    this.setupLogger();
  }

  private setupLogger(): void {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'attachment-summarizer' },
      transports: [
        new winston.transports.Console()
      ]
    });
  }

  async processQueue(): Promise<void> {
    try {
      const queueUrl = process.env.ATTACHMENT_QUEUE_URL;
      if (!queueUrl) {
        throw new Error('ATTACHMENT_QUEUE_URL environment variable not set');
      }

      const receiveParams = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      };

      const data = await this.sqs.receiveMessage(receiveParams).promise();
      
      if (data.Messages && data.Messages.length > 0) {
        for (const message of data.Messages) {
          await this.processMessage(message);
        }
      }
    } catch (error) {
      this.logger.error('Error processing queue:', error);
    }
  }

  private async processMessage(message: SQS.Message): Promise<void> {
    try {
      const messageBody = JSON.parse(message.Body || '{}');
      const { attachmentId, bucket, key } = messageBody;
      
      // Download attachment from GCS
      const fileContent = await this.downloadFromGCS(bucket, key);
      
      // Process content based on file type
      const content = await this.extractContent(fileContent);
      
      // Generate summary using LLM
      const summary = await this.generateSummary(content);
      
      // Save summary to database
      await this.saveSummary(attachmentId, summary);
      
      // Delete message from queue
      await this.deleteMessage(message.ReceiptHandle);
      
    } catch (error) {
      this.logger.error('Error processing message:', error);
    }
  }

  private async downloadFromGCS(bucket: string, key: string): Promise<Buffer> {
    const file = this.storage.bucket(bucket).file(key);
    const buffer = await file.download();
    return buffer[0];
  }

  private async extractContent(fileContent: Buffer): Promise<string> {
    // Implementation for content extraction based on file type
    // This is a simplified version - in practice, this would handle different file types
    return fileContent.toString();
  }

  private async generateSummary(content: string): Promise<string> {
    // Call to Ollama LLM to generate summary
    try {
      const response = await this.ollama.generate({
        model: process.env.SUMMARIZATION_MODEL || 'llama2',
        prompt: `Summarize the following content in a clear and concise way:\n\n${content}`,
        stream: false
      });
      return response.response;
    } catch (error) {
      throw new Error(`LLM generation failed: ${error}`);
    }
  }

  private async saveSummary(attachmentId: string, summary: string): Promise<void> {
    // Save to database
    await this.prisma.attachment.update({
      where: { id: attachmentId },
      data: { summary: summary }
    });
  }

  private async deleteMessage(receiptHandle: string): Promise<void> {
    const queueUrl = process.env.ATTACHMENT_QUEUE_URL;
    if (queueUrl) {
      const deleteParams = {
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
      };
      await this.sqs.deleteMessage(deleteParams).promise();
    }
  }
}

// Initialize the service
const service = new AttachmentSummarizerService();
service.processQueue().catch(console.error);