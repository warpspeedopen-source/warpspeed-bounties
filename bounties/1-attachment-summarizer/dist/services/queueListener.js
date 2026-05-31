"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueListener = void 0;
const client_sqs_1 = require("@aws-sdk/client-sqs");
const logger_1 = require("../utils/logger");
const fs = __importStar(require("fs"));
class QueueListener {
    sqsClient;
    queueUrl;
    storageDownloader;
    llmSummarizer;
    isRunning = false;
    constructor(storageDownloader, llmSummarizer) {
        this.storageDownloader = storageDownloader;
        this.llmSummarizer = llmSummarizer;
        this.queueUrl = process.env.SQS_QUEUE_URL || '';
        const region = process.env.AWS_REGION || 'us-east-1';
        if (!this.queueUrl) {
            logger_1.logger.warn('SQS_QUEUE_URL environment variable is not defined. Polling will fail unless configured dynamically.');
        }
        try {
            this.sqsClient = new client_sqs_1.SQSClient({ region });
            logger_1.logger.info('Initialized AWS SQS Client', { region, queueUrl: this.queueUrl });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize AWS SQS Client', error);
            throw error;
        }
    }
    /**
     * Starts the polling loop to receive events from SQS.
     */
    async start() {
        if (this.isRunning) {
            logger_1.logger.warn('QueueListener is already running.');
            return;
        }
        if (!this.queueUrl) {
            throw new Error('Cannot start QueueListener: SQS_QUEUE_URL is not configured.');
        }
        this.isRunning = true;
        logger_1.logger.info('QueueListener started, entering poll loop...');
        this.pollLoop();
    }
    /**
     * Stops the polling loop gracefully.
     */
    async stop() {
        logger_1.logger.info('Stopping QueueListener gracefully...');
        this.isRunning = false;
    }
    /**
     * Continuous SQS polling loop
     */
    async pollLoop() {
        while (this.isRunning) {
            try {
                logger_1.logger.debug('Polling SQS for messages...', { queueUrl: this.queueUrl });
                const command = new client_sqs_1.ReceiveMessageCommand({
                    QueueUrl: this.queueUrl,
                    MaxNumberOfMessages: 1,
                    WaitTimeSeconds: 20, // Long polling (cost-efficient)
                    VisibilityTimeout: 120 // 2 minutes visibility buffer for GCS download + LLM run
                });
                const response = await this.sqsClient.send(command);
                if (response.Messages && response.Messages.length > 0) {
                    logger_1.logger.info(`Received ${response.Messages.length} message(s) from SQS.`);
                    for (const message of response.Messages) {
                        if (!this.isRunning)
                            break;
                        await this.processMessage(message);
                    }
                }
                else {
                    logger_1.logger.debug('No messages received during this poll interval.');
                }
            }
            catch (error) {
                logger_1.logger.error('Error in SQS poll loop', error);
                // Backoff to avoid hot-looping when SQS is down or credentials expire
                if (this.isRunning) {
                    logger_1.logger.info('Sleeping for 5 seconds before retrying SQS poll due to error...');
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                }
            }
        }
        logger_1.logger.info('QueueListener poll loop exited.');
    }
    /**
     * Processes a single SQS message
     */
    async processMessage(message) {
        const messageId = message.MessageId;
        const receiptHandle = message.ReceiptHandle;
        if (!receiptHandle) {
            logger_1.logger.error('Received SQS message without a ReceiptHandle, cannot process.', null, { messageId });
            return;
        }
        logger_1.logger.info('Processing SQS message', { messageId });
        let localFilePath = null;
        try {
            if (!message.Body) {
                throw new Error('SQS message body is empty.');
            }
            // 1. Parse JSON Body
            let event;
            try {
                event = JSON.parse(message.Body);
            }
            catch (parseError) {
                logger_1.logger.warn('Failed to parse message body as JSON. Deleting poison message to avoid blocking queue.', {
                    messageId,
                    body: message.Body
                });
                await this.deleteMessage(receiptHandle);
                return;
            }
            // 2. Validate Event Schema
            const { bucket, key } = event;
            if (!bucket || !key) {
                logger_1.logger.warn('Invalid event payload: Missing bucket or key parameter. Deleting message.', {
                    messageId,
                    event
                });
                await this.deleteMessage(receiptHandle);
                return;
            }
            // 3. Download Attachment from GCS
            localFilePath = await this.storageDownloader.downloadFile(bucket, key);
            // 4. Summarize local file content
            const summary = await this.llmSummarizer.summarize(localFilePath);
            // 5. Output Summary to Logs (and placeholder for db / webhook)
            logger_1.logger.info('SUMMARY CREATED SUCCESSFULLY', {
                messageId,
                gcsPath: `gs://${bucket}/${key}`,
                summary: summary
            });
            // 6. Delete message from queue upon success
            await this.deleteMessage(receiptHandle);
            logger_1.logger.info(`Message ${messageId} deleted from SQS queue successfully.`);
        }
        catch (error) {
            logger_1.logger.error('Error processing SQS message', error, { messageId });
            // Reset visibility to 0 so it can be retried immediately by another worker
            try {
                logger_1.logger.info('Resetting SQS message visibility timeout for immediate retry...', { messageId });
                const changeVisibilityCommand = new client_sqs_1.ChangeMessageVisibilityCommand({
                    QueueUrl: this.queueUrl,
                    ReceiptHandle: receiptHandle,
                    VisibilityTimeout: 0
                });
                await this.sqsClient.send(changeVisibilityCommand);
            }
            catch (visibilityError) {
                logger_1.logger.error('Failed to reset message visibility timeout', visibilityError, { messageId });
            }
        }
        finally {
            // 7. Cleanup the temporary downloaded file to prevent disk fill-up
            if (localFilePath && fs.existsSync(localFilePath)) {
                try {
                    fs.unlinkSync(localFilePath);
                    logger_1.logger.debug('Cleaned up local temporary downloaded file', { localFilePath });
                }
                catch (cleanupError) {
                    logger_1.logger.error(`Failed to delete local temporary file: ${localFilePath}`, cleanupError);
                }
            }
        }
    }
    /**
     * Helper to delete message from SQS
     */
    async deleteMessage(receiptHandle) {
        const deleteCommand = new client_sqs_1.DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: receiptHandle
        });
        await this.sqsClient.send(deleteCommand);
    }
}
exports.QueueListener = QueueListener;
