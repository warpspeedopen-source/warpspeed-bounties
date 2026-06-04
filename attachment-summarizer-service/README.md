# Attachment Summarizer Service

This document contains the complete source code and setup instructions for the Attachment Summarizer Service, a Node.js application designed to meet the requirements of the specified bounty.

## Overview

The service performs the following actions:
1.  Listens for new attachment events on an AWS SQS queue.
2.  Fetches attachment metadata (like GCS path) from a PostgreSQL database.
3.  Downloads the corresponding file from Google Cloud Storage.
4.  Extracts text content from various file types (PDF, DOCX, XLSX, TXT, HTML, Images).
5.  Generates a concise, factual summary of the content using a self-hosted Ollama LLM.
6.  Saves the extracted content and summary back to the database, updating the attachment's status.

The entire service and its dependencies (PostgreSQL, Ollama) are containerized using Docker for easy setup and deployment.

## Project Structure

```
attachment-summarizer-service/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── index.ts
│   ├── lib/
│   │   ├── logger.ts
│   │   └── prisma.ts
│   ├── processors/
│   │   └── attachment.processor.ts
│   ├── services/
│   │   ├── gcs.service.ts
│   │   ├── llm.service.ts
│   │   ├── parser.service.ts
│   │   └── sqs.consumer.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
├── README.md
└── tsconfig.json
```

## Setup and Installation

### Prerequisites
- Docker and Docker Compose
- Node.js and npm (for `prisma` commands)
- AWS credentials with SQS access
- Google Cloud credentials with GCS access

### Steps

1.  **Clone the Repository:** Create a directory named `attachment-summarizer-service` and place all the files listed below into their respective paths.

2.  **Create `.env` file:** Copy `.env.example` to `.env` and fill in your specific credentials and configuration.

3.  **Install Dependencies:** Run `npm install` to install Prisma client and other utilities.

4.  **Database Migration:** Run the initial database migration:
    ```bash
    npm run prisma:migrate
    ```

5.  **Start the Services:** Launch the application, database, and LLM using Docker Compose.
    ```bash
    docker-compose up --build
    ```
    The first time you run this, it will download the Postgres and Ollama images, as well as the `llama3` model, which may take some time.

## How It Works

1.  An external service creates a record in the `Attachment` table with `status = 'PENDING'` and the `gcsPath`.
2.  The external service then sends a message to the SQS queue containing the `attachmentId`.
3.  The `sqs.consumer.ts` service polls the queue and receives the message.
4.  It passes the `attachmentId` to the `attachment.processor.ts`.
5.  The processor orchestrates the download, parsing, summarization, and database updates.
6.  If any step fails, the attachment status is set to `FAILED` with an error message.

---

## File Contents

### `package.json`

```json
{
  "name": "attachment-summarizer-service",
  "version": "1.0.0",
  "description": "Consumes attachment events, downloads from GCS, and generates summaries using an LLM.",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name init"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@aws-sdk/client-sqs": "^3.577.0",
    "@google-cloud/storage": "^7.11.0",
    "@prisma/client": "^5.14.0",
    "cheerio": "^1.0.0-rc.12",
    "dotenv": "^16.4.5",
    "mammoth": "^1.7.2",
    "ollama": "^0.5.1",
    "pdf-parse": "^1.1.1",
    "pino": "^9.1.0",
    "tesseract.js": "^5.1.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.12.12",
    "@types/pdf-parse": "^1.1.4",
    "jest": "^29.7.0",
    "pino-pretty": "^11.1.0",
    "prisma": "^5.14.0",
    "ts-jest": "^29.1.3",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

### `Dockerfile`

```dockerfile
# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

# Copy Tesseract trained data
# This is required for OCR
RUN apk add --no-cache tesseract-ocr-data-eng

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

### `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: summarizer_app
    depends_on:
      - db
      - ollama
    env_file:
      - .env
    volumes:
      - .:/usr/src/app # For development hot-reloading
      - /usr/src/app/node_modules # Don't mount over node_modules
    command: npm run dev

  db:
    image: postgres:15
    container_name: summarizer_db
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # This command will pull and run the llama3 model on startup
    command: sh -c "ollama serve & sleep 5 && ollama run llama3 & wait"

volumes:
  postgres_data:
  ollama_data:
```

### `.env.example`

```
# Database Configuration
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=attachment_summarizer
DATABASE_URL="postgresql://postgres:password@db:5432/attachment_summarizer?schema=public"

# AWS SQS Configuration
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SQS_QUEUE_URL=

# Google Cloud Storage Configuration
# If using a service account key file, uncomment the line below
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/keyfile.json
GCS_BUCKET_NAME=

# Ollama Configuration
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=llama3

# Service Configuration
LOG_LEVEL=info
```

### `.gitignore`

```
node_modules
dist
.env
```

### `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Attachment {
  id               String    @id @default(cuid())
  gcsPath          String
  mimeType         String
  status           Status    @default(PENDING)
  extractedContent String?
  summary          String?
  errorMessage     String?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

enum Status {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

### `src/config/index.ts`

```typescript
import 'dotenv/config';

export const config = {
  aws: {
    region: process.env.AWS_REGION!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    sqsQueueUrl: process.env.SQS_QUEUE_URL!,
  },
  gcs: {
    bucketName: process.env.GCS_BUCKET_NAME!,
  },
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama3',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Basic validation
if (!config.aws.region || !config.aws.sqsQueueUrl || !config.gcs.bucketName) {
  throw new Error('Missing required environment variables for AWS or GCS.');
}
```

### `src/lib/logger.ts`

```typescript
import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
    },
  },
});
```

### `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

### `src/types/index.ts`

```typescript
export interface AttachmentEventPayload {
  attachmentId: string;
}
```

### `src/services/gcs.service.ts`

```typescript
import { Storage } from '@google-cloud/storage';
import { config } from '../config';
import { logger } from '../lib/logger';

const storage = new Storage();

export async function downloadAttachment(gcsPath: string): Promise<Buffer> {
  logger.info({ gcsPath }, 'Downloading attachment from GCS.');
  try {
    const [fileContents] = await storage
      .bucket(config.gcs.bucketName)
      .file(gcsPath)
      .download();
    logger.info({ gcsPath }, 'Successfully downloaded attachment.');
    return fileContents;
  } catch (error) {
    logger.error({ error, gcsPath }, 'Failed to download attachment from GCS.');
    throw new Error(`GCS download failed for path: ${gcsPath}`);
  }
}
```

### `src/services/parser.service.ts`

```typescript
import { logger } from '../lib/logger';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Tesseract from 'tesseract.js';
import * as cheerio from 'cheerio';

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  logger.info({ mimeType }, 'Extracting text from file.');

  if (mimeType.startsWith('text/html')) {
    const htmlContent = buffer.toString('utf-8');
    const $ = cheerio.load(htmlContent);
    return $('body').text().replace(/\s+/g, ' ').trim();
  } 
  
  if (mimeType.startsWith('text/')) {
    return buffer.toString('utf-8');
  }
  
  if (mimeType === 'application/pdf') {
    const data = await pdf(buffer);
    return data.text;
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let fullText = '';
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      fullText += XLSX.utils.sheet_to_txt(sheet) + '\n';
    });
    return fullText;
  }

  if (mimeType.startsWith('image/')) {
    logger.warn('Image processing (OCR) can be slow and resource-intensive.');
    const { data: { text } } = await Tesseract.recognize(buffer);
    return text;
  }

  throw new Error(`Unsupported mime type: ${mimeType}`);
}
```

### `src/services/llm.service.ts`

```typescript
import { Ollama } from 'ollama';
import { config } from '../config';
import { logger } from '../lib/logger';

const ollama = new Ollama({ host: config.ollama.host });

const MAX_CONTENT_LENGTH = 15000; // Character limit to avoid overloading the LLM

export async function generateSummary(content: string): Promise<string> {
  logger.info('Generating summary with Ollama.');

  const truncatedContent = content.length > MAX_CONTENT_LENGTH
    ? content.substring(0, MAX_CONTENT_LENGTH)
    : content;

  try {
    const response = await ollama.chat({
      model: config.ollama.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert assistant that creates short, factual summaries of provided text. Focus on key facts, figures, and conclusions. Do not add any preamble or conversational text. The summary should not exceed 150 words.'
        },
        {
          role: 'user',
          content: `Please summarize the following content:\n\n${truncatedContent}`,
        },
      ],
    });

    logger.info('Successfully generated summary.');
    return response.message.content.trim();
  } catch (error) {
    logger.error({ error }, 'Failed to generate summary from Ollama.');
    throw new Error('LLM summary generation failed.');
  }
}
```

### `src/processors/attachment.processor.ts`

```typescript
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { downloadAttachment } from '../services/gcs.service';
import { extractTextFromFile } from '../services/parser.service';
import { generateSummary } from '../services/llm.service';
import { AttachmentEventPayload } from '../types';

export async function processAttachment(payload: AttachmentEventPayload): Promise<void> {
  const { attachmentId } = payload;
  logger.info({ attachmentId }, 'Starting processing for attachment.');

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    logger.error({ attachmentId }, 'Attachment not found in database.');
    throw new Error('Attachment not found');
  }

  await prisma.attachment.update({
    where: { id: attachmentId },
    data: { status: 'PROCESSING' },
  });

  try {
    const fileBuffer = await downloadAttachment(attachment.gcsPath);
    const extractedContent = await extractTextFromFile(fileBuffer, attachment.mimeType);

    if (!extractedContent.trim()) {
      logger.warn({ attachmentId }, 'No content extracted from attachment.');
      await prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          status: 'COMPLETED',
          extractedContent: '',
          summary: 'No textual content could be extracted from the file.',
        },
      });
      return;
    }

    const summary = await generateSummary(extractedContent);

    await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        status: 'COMPLETED',
        summary,
        extractedContent: extractedContent.substring(0, 20000), // Store a snippet
      },
    });

    logger.info({ attachmentId }, 'Successfully processed attachment.');
  } catch (error: any) {
    logger.error({ attachmentId, error: error.message }, 'Failed to process attachment.');
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: { status: 'FAILED', errorMessage: error.message },
    });
    // Re-throw to prevent SQS message deletion for potential retry
    throw error;
  }
}
```

### `src/services/sqs.consumer.ts`

```typescript
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, Message } from '@aws-sdk/client-sqs';
import { config } from '../config';
import { logger } from '../lib/logger';
import { processAttachment } from '../processors/attachment.processor';
import { AttachmentEventPayload } from '../types';

const sqsClient = new SQSClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

async function handleMessage(message: Message): Promise<void> {
  if (!message.Body) {
    logger.warn('Received message with empty body.');
    return;
  }

  logger.info({ messageId: message.MessageId }, 'Received new message from SQS.');

  let payload: AttachmentEventPayload;
  try {
    payload = JSON.parse(message.Body);
  } catch (error) {
    logger.error({ body: message.Body }, 'Failed to parse SQS message body.');
    // Do not requeue a malformed message
    return;
  }

  await processAttachment(payload);
}

export async function startConsumer() {
  logger.info(`Starting SQS consumer for queue: ${config.aws.sqsQueueUrl}`);
  while (true) {
    try {
      const receiveParams = {
        QueueUrl: config.aws.sqsQueueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      };

      const command = new ReceiveMessageCommand(receiveParams);
      const { Messages } = await sqsClient.send(command);

      if (Messages && Messages.length > 0) {
        const promises = Messages.map(async (message) => {
          try {
            await handleMessage(message);
            const deleteParams = {
              QueueUrl: config.aws.sqsQueueUrl,
              ReceiptHandle: message.ReceiptHandle!,
            };
            await sqsClient.send(new DeleteMessageCommand(deleteParams));
          } catch (error) {
            logger.error({ messageId: message.MessageId, error }, 'Processing failed, message will be returned to queue.');
          }
        });
        await Promise.all(promises);
      } else {
        logger.trace('No messages received, continuing to poll.');
      }
    } catch (error) {
      logger.error({ error }, 'Error in SQS polling loop. Retrying in 10s.');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}
```

### `src/index.ts`

```typescript
import { logger } from './lib/logger';
import { startConsumer } from './services/sqs.consumer';

async function main() {
  logger.info('Starting attachment summarizer service...');

  // Add any additional startup logic here, like connecting to DB
  // Prisma connects lazily, so no explicit connect call is needed.

  await startConsumer();
}

main().catch((err) => {
  logger.fatal({ error: err }, 'Service failed to start or crashed.');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully.');
  process.exit(0);
});
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully.');
  process.exit(0);
});
```
