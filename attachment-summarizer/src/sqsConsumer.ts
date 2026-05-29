import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { config } from './config';
import { processMessage } from './processor';

const sqsClient = new SQSClient({ region: config.awsRegion });

export async function pollQueue() {
  console.log(`Polling SQS queue: ${config.sqsQueueUrl}`);
  while (true) {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: config.sqsQueueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
      });

      const response = await sqsClient.send(command);

      if (response.Messages && response.Messages.length > 0) {
        for (const message of response.Messages) {
          if (message.Body) {
            try {
              console.log(`Processing message: ${message.MessageId}`);
              const payload = JSON.parse(message.Body);
              await processMessage(message.MessageId!, payload);
              
              // Delete message after successful processing
              await sqsClient.send(new DeleteMessageCommand({
                QueueUrl: config.sqsQueueUrl,
                ReceiptHandle: message.ReceiptHandle,
              }));
              console.log(`Message deleted: ${message.MessageId}`);
            } catch (err) {
              console.error(`Error processing message ${message.MessageId}:`, err);
              // Do not delete so it can be retried or sent to DLQ
            }
          }
        }
      }
    } catch (err) {
      console.error('Error polling SQS:', err);
      await new Promise(resolve => setTimeout(resolve, 5000)); // sleep on error
    }
  }
}
