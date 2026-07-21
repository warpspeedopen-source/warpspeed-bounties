import { SQSClient, ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import { Storage } from "@google-cloud/storage";
import { PrismaClient } from "@prisma/client";
import { Ollama } from "ollama";

const prisma = new PrismaClient();
const sqsClient = new SQSClient({ region: "us-east-1" });
const storage = new Storage({ projectId: "your-project-id" });
const ollama = new Ollama({ host: "http://localhost:8000" });

const queueUrl = "https://sqs.us-east-1.amazonaws.com/123456789012/your-queue";

async function processMessage(message: any) {
  try {
    const attachmentId = message.attachmentId;
    const bucketName = message.bucketName;
    const objectKey = message.objectKey;
    const mimeType = message.mimeType;

    const fileBuffer = await downloadFileFromGCS(bucketName, objectKey);
    const extractedText = await extractTextFromBuffer(fileBuffer, mimeType);
    const summary = await generateSummary(extractedText);

    await saveSummaryToDatabase(attachmentId, summary);
  } catch (error) {
    console.error(error);
  }
}

async function downloadFileFromGCS(bucketName: string, objectKey: string) {
  const file = storage.bucket(bucketName).file(objectKey);
  const [fileBuffer] = await file.download();
  return fileBuffer;
}

async function extractTextFromBuffer(fileBuffer: Buffer, mimeType: string) {
  switch (mimeType) {
    case "application/pdf":
      // Use a PDF extraction library like pdfjs
      break;
    case "application/msword":
      // Use a Word document extraction library like docx
      break;
    case "text/plain":
      return fileBuffer.toString();
    default:
      throw new Error(`Unsupported mime type: ${mimeType}`);
  }
}

async function generateSummary(text: string) {
  const response = await ollama.summarize(text);
  return response.summary;
}

async function saveSummaryToDatabase(attachmentId: string, summary: string) {
  await prisma.attachment.create({
    data: {
      id: attachmentId,
      summary,
    },
  });
}

async function main() {
  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 10,
  };

  while (true) {
    const data = await sqsClient.send(new ReceiveMessageCommand(params));
    if (data.Messages) {
      data.Messages.forEach((message) => processMessage(message.Body));
    }
  }
}

main();