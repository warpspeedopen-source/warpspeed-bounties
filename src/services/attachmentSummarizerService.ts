import { SQSService } from './sqsService';
import { GcsService } from './gcsService';
import { OllamaService } from './ollamaService';
import { JobService } from './jobService';
import { extractContent } from '../utils/fileExtractor';
import { logger } from '../utils/logger';
import { config } from '../config';

export class AttachmentSummarizerService {
  private sqsService: SQSService;
  private gcsService: GcsService;
  private ollamaService: OllamaService;
  private jobService: JobService;

  constructor() {
    this.sqsService = new SQSService();
    this.gcsService = new GcsService();
    this.ollamaService = new OllamaService();
    this.jobService = new JobService();
  }

  async processMessage(message: any) {
    try {
      const body = JSON.parse(message.Body);
      const { filename, mimeType, gcsPath, jobId } = body;

      logger.info('Processing message', { jobId, filename });

      // Update job status to processing
      await this.jobService.updateJobStatus(jobId, 'PROCESSING');

      // Download file from GCS
      const fileBuffer = await this.gcsService.downloadFile(gcsPath);

      // Extract content from file
      const extractedContent = await extractContent(fileBuffer, mimeType);

      // Generate summary
      const summary = await this.ollamaService.summarize(extractedContent.text);

      // Update job with summary
      await this.jobService.updateJobStatus(jobId, 'COMPLETED', summary);

      // Delete message from SQS
      await this.sqsService.deleteMessage(message.ReceiptHandle);

      logger.info('Successfully processed message', { jobId });
    } catch (error) {
      logger.error('Error processing message', { messageId: message.MessageId, error });

      // Update job status to failed
      try {
        const body = JSON.parse(message.Body);
        const { jobId } = body;
        await this.jobService.updateJobStatus(jobId, 'FAILED', undefined, error instanceof Error ? error.message : 'Unknown error');
      } catch (updateError) {
        logger.error('Error updating job status to failed', { messageId: message.MessageId, error: updateError });
      }

      // Delete message from SQS even if processing failed to prevent reprocessing
      await this.sqsService.deleteMessage(message.ReceiptHandle);
    }
  }

  async startPolling() {
    logger.info('Starting SQS polling');
    setInterval(async () => {
      try {
        const messages = await this.sqsService.receiveMessages();
        
        if (messages.length > 0) {
          logger.info(`Received ${messages.length} messages from SQS`);
          
          // Process messages in parallel
          await Promise.all(
            messages.map(message => this.processMessage(message))
          );
        }
      } catch (error) {
        logger.error('Error in polling loop', { error });
      }
    }, config.server.pollingInterval || 5000);
  }
}