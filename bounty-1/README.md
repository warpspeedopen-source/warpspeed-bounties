# Warpspeed Attachment Summarizer Service

**Bounty:** $960 — [Attachment Summarizer Service](https://github.com/warpspeedopen-source/warpspeed-bounties/issues/1)

A Node.js service that consumes email attachment events from AWS SQS, downloads attachments from Google Cloud Storage, extracts content from supported file types, and generates natural-language summaries using a self-hosted open-source LLM (Ollama).

## Architecture

```
[SQS Queue] ──→ [SQS Consumer] ──→ [Orchestrator] ──→ [Content Extractor] ──→ [Ollama LLM]
                                           │                    │
                                           ▼                    ▼
                                      [PostgreSQL via Prisma]
                                           │
                                           ▼
                                      [Express HTTP API]
```

## Features

- **SQS Consumer**: Long-polling consumer for attachment event messages
- **Attachment Download**: From GCS (`@google-cloud/storage`) or direct URL (axios)
- **Content Extraction**: PDF (`pdf-parse`), DOCX (`mammoth`), plain text, HTML (strip tags), images (Tesseract OCR), CSV
- **LLM Summarization**: Integration with self-hosted Ollama (llama3.2) with extractive fallback
- **Database**: PostgreSQL via Prisma — tracks all processing state, extracted content, summaries, and logs
- **Monitoring**: Express health check endpoint + stats API
- **Docker**: Multi-stage Dockerfile + docker-compose (app, postgres, redis, ollama)
- **Resilience**: Retry logic, graceful error handling, cleanup of temp files

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for full stack)
- Ollama (or use the docker-compose service)

### Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Start the service
cp .env.example .env   # Edit with your AWS/GCS credentials
npm run dev
```

### Docker (full stack)

```bash
# Start all services
docker-compose up -d

# Pull a model in Ollama
docker-compose exec ollama ollama pull llama3.2

# Check health
curl http://localhost:3000/health
```

### Test

```bash
npm test
```

## Sample SQS Event Payload

```json
{
  "eventId": "evt-abc123",
  "sourceUrl": "https://storage.googleapis.com/bucket/doc.pdf",
  "fileName": "invoice_Q1_2024.pdf",
  "mimeType": "application/pdf",
  "fileSizeBytes": 245760,
  "messageId": "msg-987"
}
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (sqs, gcs, ollama, database) |
| `/stats` | GET | Processing statistics |
| `/attachments/:eventId` | GET | Full processing details for an attachment |

## Processing Flow

1. **Receive**: SQS message arrives → parsed into `AttachmentEvent`
2. **Download**: File downloaded from GCS or URL → saved to temp dir
3. **Extract**: Content extracted based on file type (PDF/DOCX/TXT/HTML/image)
4. **Summarize**: Extracted text sent to Ollama LLM → receives summary
5. **Store**: All state persisted to PostgreSQL via Prisma
6. **Respond**: Success → message deleted from SQS. Failure → message remains for retry.

## Bounty Claim

To claim this bounty:
1. Sign up at https://warpspeedopen.org/signup
2. Comment on [issue #1](https://github.com/warpspeedopen-source/warpspeed-bounties/issues/1): "I have signed up and would like to claim this bounty."
3. Wait for maintainer confirmation
4. Fork this repo and submit a PR
