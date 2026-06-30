import { AttachmentSummarizerService } from './attachmentSummarizer';

async function main(): Promise<void> {
  const service = new AttachmentSummarizerService();
  await service.processQueue();
}

main().catch(error => {
  console.error('Error in attachment summarizer service:', error);
  process.exit(1);
});