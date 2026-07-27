import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { Storage } from "@google-cloud/storage";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const sqsClient = new SQSClient({});
const storage = new Storage();

const QUEUE_URL = process.env.SQS_QUEUE_URL || "";
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "";
const TEMP_DIR = path.join(os.tmpdir(), "attachment-summarizer");

if (!QUEUE_URL) {
  console.error("SQS_QUEUE_URL environment variable is not set");
  process.exit(1);
}
if (!BUCKET_NAME) {
  console.error("GCS_BUCKET_NAME environment variable is not set");
  process.exit(1);
}

async function receiveMessages() {
  const command = new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 5,
    WaitTimeSeconds: 20,
  });
  const response = await sqsClient.send(command);
  return response.Messages || [];
}

async function deleteMessage(receiptHandle: string) {
  const command = new DeleteMessageCommand({
    QueueUrl: QUEUE_URL,
    ReceiptHandle: receiptHandle,
  });
  await sqsClient.send(command);
}

async function downloadAttachment(objectName: string, destPath: string) {
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(objectName);
  await file.download({ destination: destPath });
}

async function extractText(filePath: string): Promise<string> {
  // Use 'pdftotext' for PDFs, 'catdoc' for Word docs, 'xlsx2csv' for spreadsheets, 'cat' for text/html, 'tesseract' for images
  // For simplicity, detect by extension and run appropriate tool
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    return await runCommand("pdftotext", [filePath, "-"]);
  } else if (ext === ".doc" || ext === ".docx") {
    // Use 'docx2txt' or 'catdoc' if installed; fallback to empty string
    try {
      return await runCommand("docx2txt", [filePath, "-"]);
    } catch {
      try {
        return await runCommand("catdoc", [filePath]);
      } catch {
        return "";
      }
    }
  } else if (ext === ".xls" || ext === ".xlsx" || ext === ".csv") {
    try {
      return await runCommand("xlsx2csv", [filePath, "-"]);
    } catch {
      try {
        return await runCommand("csvtool", ["cat", filePath]);
      } catch {
        return "";
      }
    }
  } else if (ext === ".txt" || ext === ".html" || ext === ".htm") {
    return await runCommand("cat", [filePath]);
  } else if (ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".bmp" || ext === ".tiff") {
    // Use tesseract OCR
    try {
      return await runCommand("tesseract", [filePath, "stdout"]);
    } catch {
      return "";
    }
  } else {
    // Unknown type, return empty string
    return "";
  }
}

function runCommand(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command ${cmd} exited with code ${code}: ${stderr}`));
      }
    });
  });
}

async function generateSummary(text: string): Promise<string> {
  // Call local LLM via CLI (e.g. ollama) to generate a short factual summary
  // We assume 'ollama' CLI is installed and a model named 'llama2' is available
  // We pass the text as input and get the summary output

  return new Promise((resolve, reject) => {
    const proc = spawn("ollama", ["run", "llama2", "--prompt", `Summarize the following text in a short factual paragraph:\n\n${text}`]);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(`LLM command exited with code ${code}: ${stderr}`));
      }
    });
  });
}

async function processMessage(message: any) {
  try {
    const body = JSON.parse(message.Body);
    if (!body.attachment || !body.attachment.objectName) {
      console.warn("Message missing attachment.objectName:", message.Body);
      return;
    }
    const objectName = body.attachment.objectName;
    const fileName = path.basename(objectName);
    const localPath = path.join(TEMP_DIR, fileName);

    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    console.log(`Downloading attachment ${objectName}...`);
    await downloadAttachment(objectName, localPath);

    console.log(`Extracting text from ${fileName}...`);
    const text = await extractText(localPath);

    if (!text.trim()) {
      console.warn(`No text extracted from ${fileName}`);
    }

    console.log(`Generating summary for ${fileName}...`);
    const summary = await generateSummary(text);

    console.log(`Summary for ${fileName}:\n${summary}`);

    // TODO: Store or forward the summary as needed

    await deleteMessage(message.ReceiptHandle);
  } catch (err) {
    console.error("Error processing message:", err);
  }
}

async function main() {
  console.log("Starting Attachment Summarizer Service...");
  while (true) {
    try {
      const messages = await receiveMessages();
      if (messages.length === 0) {
        continue;
      }
      for (const message of messages) {
        await processMessage(message);
      }
    } catch (err) {
      console.error("Error in main loop:", err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
