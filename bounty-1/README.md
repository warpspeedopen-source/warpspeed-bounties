# Attachment Summarizer

Consumes email attachment events from AWS SQS, downloads files from Google Cloud Storage, extracts text (PDF, DOCX, TXT, images), and generates summaries via a self-hosted open-source LLM (Ollama).

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- AWS SQS queue + IAM credentials
- Google Cloud Storage bucket + service account
- Ollama with a model pulled (`llama3.1:8b` or `mistral:7b`)

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start the consumer
node -r dotenv/config dist/index.js
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SQS_QUEUE_URL` | yes | — | SQS queue URL |
| `AWS_REGION` | no | `us-east-1` | AWS region |
| `GOOGLE_APPLICATION_CREDENTIALS` | no | — | Path to GCP service account JSON |
| `DATABASE_URL` | yes | — | PostgreSQL connection string |
| `OLLAMA_BASE_URL` | no | `http://localhost:11434` | Ollama API base URL |
| `LLM_MODEL` | no | `llama3.1:8b` | Ollama model name |
| `MAX_INPUT_TOKENS` | no | `3072` | Max tokens to send to LLM |
| `MAX_OUTPUT_TOKENS` | no | `512` | Max tokens in generated summary |

## SQS Message Format

Send messages with this JSON body:

```json
{
  "attachmentId": "uuid-or-id",
  "gcsUri": "gs://bucket-name/path/to/file.pdf",
  "fileName": "invoice.pdf",
  "mimeType": "application/pdf",
  "receivedAt": "2026-07-14T12:00:00Z"
}
```

## Architecture

See [DESIGN.md](./DESIGN.md) for full architecture details.

### Directory Layout

```
├── types.ts                    # TypeScript type definitions
├── services/
│   ├── sqsConsumer.ts          # SQS long-poll consumer
│   ├── gcsDownloader.ts        # GCS file downloader
│   ├── contentExtractor.ts     # PDF/DOCX/TXT/image extraction
│   └── summarizer.ts           # Ollama LLM summarization
├── schema.prisma               # Prisma schema (PostgreSQL)
├── DESIGN.md                   # Architecture document
└── README.md                   # This file
```

## Docker

```dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr tesseract-ocr-eng poppler-utils && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
COPY prisma/ ./prisma/
RUN npx prisma generate
CMD ["node", "dist/index.js"]
```

## Deployment (Cloud Run)

```bash
gcloud builds submit --tag gcr.io/$PROJECT_ID/attachment-summarizer
gcloud run deploy attachment-summarizer \
  --image gcr.io/$PROJECT_ID/attachment-summarizer \
  --platform managed \
  --region us-central1 \
  --set-env-vars="SQS_QUEUE_URL=...,DATABASE_URL=...,OLLAMA_BASE_URL=..."
```

## Development

```bash
cp .env.example .env
npm run dev        # tsx watch src/index.ts
npm run build      # tsc
npm run lint       # biome check
```

## Supported File Types

| Type | Extension | Engine |
|---|---|---|
| PDF | `.pdf` | `pdf-parse` |
| DOCX | `.docx` | `mammoth` |
| TXT | `.txt`, `.csv`, `.log`, `.md` | `fs.readFile` |
| JPEG | `.jpg`, `.jpeg` | `tesseract.js` |
| PNG | `.png` | `tesseract.js` |
| TIFF | `.tif`, `.tiff` | `tesseract.js` |

## Monitoring

- Logs: structured JSON via `pino` (recommended).
- Metrics: expose Prometheus gauge for queue depth and processing latency.
- Alerts: DLQ message count > 0 should trigger an alert.
