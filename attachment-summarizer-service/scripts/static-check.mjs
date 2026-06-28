import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "package.json",
  "tsconfig.json",
  "Dockerfile",
  "docker-compose.yml",
  ".env.example",
  "prisma/schema.prisma",
  "src/index.ts",
  "src/worker.ts",
  "src/queue/sqsConsumer.ts",
  "src/storage/gcsClient.ts",
  "src/extractors/index.ts",
  "src/llm/ollamaClient.ts",
  "src/persistence/attachmentRepository.ts",
  "test/event-validation.test.ts",
  "test/extractors.test.ts",
  "test/ollama-prompt.test.ts",
  "README.md",
  "SUBMISSION.md",
];

const requiredTokens = [
  ["package.json", "@aws-sdk/client-sqs"],
  ["package.json", "@google-cloud/storage"],
  ["package.json", "@prisma/client"],
  ["src/config.ts", "OLLAMA_BASE_URL"],
  ["prisma/schema.prisma", "model AttachmentJob"],
  ["src/queue/sqsConsumer.ts", "ReceiveMessageCommand"],
  ["src/storage/gcsClient.ts", "file.download"],
  ["src/extractors/index.ts", "pdfParse"],
  ["src/extractors/index.ts", "mammoth"],
  ["src/extractors/index.ts", "Tesseract"],
  ["src/llm/ollamaClient.ts", "/api/generate"],
  ["Dockerfile", "npm run build"],
  ["docker-compose.yml", "ollama/ollama"],
];

for (const file of requiredFiles) {
  const target = path.join(root, file);
  if (!fs.existsSync(target)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

for (const [file, token] of requiredTokens) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  if (!content.includes(token)) {
    throw new Error(`Missing token "${token}" in ${file}`);
  }
}

console.log("static-check ok");
