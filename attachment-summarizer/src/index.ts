import { SQSClient, ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";
import * as pdfParse from "pdf-parse";
import * as mammoth from "mammoth";
import * as textract from "textract";
import axios from "axios";

// --- Configuration ---
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const LLM_API_URL = process.env.LLM_API_URL;

if (!SQS_QUEUE_URL || !GCS_BUCKET_NAME || !LLM_API_URL) {
  console.error("Missing required environment variables: SQS_QUEUE_URL, GCS_BUCKET_NAME, LLM_API_URL");
  process.exit(1);
}

// --- Clients ---
const sqsClient = new SQSClient({ region: AWS_REGION });
const storage = new Storage();

// --- Helper Functions ---

/**
 * Downloads an attachment from Google Cloud Storage.
 * @param filePath The path to the file in GCS.
 * @returns A Promise that resolves with the file content as a Buffer.
 */
async function downloadAttachment(filePath: string): Promise<Buffer> {
  console.log(`Downloading attachment: ${filePath} from GCS...`);
  const bucket = storage.bucket(GCS_BUCKET_NAME!);
  const file = bucket.file(filePath);
  const buffer = (await file.download())[0];
  console.log(`Attachment downloaded successfully: ${filePath}`);
  return buffer;
}

/**
 * Extracts text content from various file types.
 * @param buffer The file content as a Buffer.
 * @param fileName The name of the file.
 * @returns A Promise that resolves with the extracted text.
 */
async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  console.log(`Extracting text from: ${fileName}...`);
  const fileExtension = path.extname(fileName).toLowerCase();

  try {
    switch (fileExtension) {
      case ".pdf":
        const pdfResult = await pdfParse(buffer);
        return pdfResult.text;
      case ".doc":
      case ".docx":
        const docResult = await mammoth.extractRawText({ buffer });
        return docResult.value;
      case ".txt":
      case ".html":
        return buffer.toString();
      case ".xls":
      case ".xlsx":
        // For spreadsheets, we'll use textract as a fallback for now.
        // A more robust solution might involve dedicated spreadsheet parsing libraries.
        return new Promise((resolve, reject) => {
          textract.fromBuffer(buffer, { type: "spreadsheet" }, (err, text) => {
            if (err) reject(err);
            else resolve(text);
          });
        });
      case ".jpg":
      case ".jpeg":
      case ".png":
      case ".gif":
        // For images, we'll use textract for OCR.
        // This requires Tesseract to be installed and configured.
        return new Promise((resolve, reject) => {
          textract.fromBuffer(buffer, { type: "image" }, (err, text) => {
            if (err) reject(err);
            else resolve(text);
          });
        });
      default:
        console.warn(`Unsupported file type: ${fileExtension}. Attempting to read as plain text.`);
        return buffer.toString();
    }
  } catch (error) {
    console.error(`Error extracting text from ${fileName}:`, error);
    throw new Error(`Failed to extract text from ${fileName}`);
  }
}

/**
 * Generates a summary using a self-hosted LLM.
 * @param text The text content to summarize.
 * @returns A Promise that resolves with the generated summary.
 */
async function generateSummary(text: string): Promise<string> {
  console.log("Generating summary using LLM...");
  try {
    const response = await axios.post(LLM_API_URL!,
      {
        model: "ollama/llama3", // Example model, adjust as needed
        prompt: `Summarize the following text concisely and factually: ${text}`,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    // Assuming the LLM API returns the summary in response.data.response
    // Adjust this based on the actual LLM API response structure
    if (response.data && response.data.response) {
      console.log("Summary generated successfully.");
      return response.data.response;
    } else {
      throw new Error("LLM API did not return a valid summary.");
    }
  } catch (error: any) {
    console.error("Error generating summary from LLM:", error.message);
    throw new Error("Failed to generate summary from LLM");
  }
}

/**
 * Processes a single SQS message containing an attachment event.
 * @param message The SQS message.
 */
async function processAttachmentMessage(message: any): Promise<void> {
  try {
    const { attachmentUrl, fileName } = JSON.parse(message.Body);

    if (!attachmentUrl || !fileName) {
      console.error("Invalid message format. Missing attachmentUrl or fileName.");
      return;
    }

    // Assuming attachmentUrl is a GCS object path like 'bucket-name/path/to/file.pdf'
    // We need to extract the actual file path for downloadAttachment
    const urlParts = attachmentUrl.split('/');
    if (urlParts.length < 2) {
        console.error(`Invalid attachmentUrl format: ${attachmentUrl}`);
        return;
    }
    const gcsFilePath = urlParts.slice(1).join('/'); // Remove the bucket name if it's part of the URL

    const attachmentBuffer = await downloadAttachment(gcsFilePath);
    const extractedText = await extractText(attachmentBuffer, fileName);

    if (!extractedText) {
      console.warn(`No text extracted from ${fileName}. Skipping summary generation.`);
      return;
    }

    const summary = await generateSummary(extractedText);
    console.log(`Summary for ${fileName}:
${summary}
`);

    // TODO: Implement logic to store or send the summary (e.g., to another SQS queue, database, etc.)
    console.log(`Successfully processed ${fileName}. Summary generated.`);

  } catch (error: any) {
    console.error("Error processing attachment message:", error.message);
    // TODO: Implement dead-letter queue or retry mechanism
  }
}

/**
 * Main function to poll SQS and process messages.
 */
async function pollSQS(): Promise<void> {
  console.log("Starting attachment summarizer service...");
  console.log(`Polling SQS queue: ${SQS_QUEUE_URL}`);

  const params = {
    QueueUrl: SQS_QUEUE_URL,
    MaxNumberOfMessages: 10, // Process up to 10 messages at a time
    WaitTimeSeconds: 20,     // Long polling
    VisibilityTimeout: 300   // 5 minutes visibility timeout
  };

  try {
    const command = new ReceiveMessageCommand(params);
    const data = await sqsClient.send(command);

    if (data.Messages && data.Messages.length > 0) {
      console.log(`Received ${data.Messages.length} messages.`);
      for (const message of data.Messages) {
        await processAttachmentMessage(message);
        // TODO: Delete message from SQS after successful processing
        // const deleteParams = { QueueUrl: SQS_QUEUE_URL, ReceiptHandle: message.ReceiptHandle };
        // await sqsClient.send(new DeleteMessageCommand(deleteParams));
      }
    } else {
      // console.log("No messages received.");
    }
  } catch (error: any) {
    console.error("Error polling SQS:", error.message);
  }

  // Poll again after a short delay
  setTimeout(pollSQS, 5000); // Poll every 5 seconds if no messages or after processing
}

// --- Initialization ---

// Ensure necessary dependencies are installed:
// npm install @aws-sdk/client-sqs @google-cloud/storage pdf-parse mammoth textract axios
// For textract with images, you might need to install Tesseract OCR:
// https://github.com/textract/textract#installation

pollSQS().catch(err => {
  console.error("Service failed to start:", err);
  process.exit(1);
});
