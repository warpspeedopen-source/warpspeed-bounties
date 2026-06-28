# Attachment Summarizer Service

This implementation is a production-oriented Node.js/TypeScript worker for the
warpSpeed OPEN Attachment Summarizer bounty.

It consumes attachment events from AWS SQS, downloads files from Google Cloud
Storage, extracts text from common attachment types, summarizes the content with
a locally hosted Ollama model, and persists job state with Prisma.

## Features

- AWS SQS long-polling worker with visibility timeout configuration
- Google Cloud Storage attachment download
- Prisma-backed idempotent job tracking
- Supported extraction paths:
  - plain text
  - HTML
  - CSV / TSV
  - PDF
  - Word `.docx`
  - spreadsheets `.xlsx` / `.xls`
  - image OCR via `tesseract.js`
- Local LLM summarization through Ollama
- Docker and Docker Compose setup
- Unit tests for parsing, validation, and summarization prompt shaping
- Structured logging and retry-friendly error states

## Event Format

SQS messages should contain JSON like:

```json
{
  "eventId": "evt_123",
  "messageId": "email_456",
  "bucket": "mail-attachments",
  "objectName": "inbox/user/document.pdf",
  "filename": "document.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 123456
}
```

`eventId`, `bucket`, `objectName`, and `filename` are required.

## Local Setup

```bash
cp .env.example .env
docker compose up -d postgres ollama
npm install
npm run prisma:generate
npm run build
npm test
```

Pull an Ollama model before running the worker:

```bash
docker compose exec ollama ollama pull llama3.1:8b
```

Run database migrations:

```bash
npx prisma migrate dev --name init
```

Start the worker:

```bash
npm run dev
```

## Production Notes

- Use Workload Identity or `GOOGLE_APPLICATION_CREDENTIALS` for GCS auth.
- Configure AWS credentials through the normal AWS SDK provider chain.
- Keep `MAX_ATTACHMENT_BYTES` conservative to avoid worker memory spikes.
- Set `OCR_IMAGES=false` if OCR latency is too high for the deployment tier.
- Keep Ollama on the same private network as the worker.

## Bounty Mapping

- Consumes SQS events: `src/queue/sqsConsumer.ts`
- Downloads GCS objects: `src/storage/gcsClient.ts`
- Extracts supported file types: `src/extractors/index.ts`
- Summarizes with local LLM: `src/llm/ollamaClient.ts`
- Persists state with Prisma: `src/persistence/attachmentRepository.ts`
- Worker orchestration: `src/worker.ts`
- Docker setup: `Dockerfile`, `docker-compose.yml`

