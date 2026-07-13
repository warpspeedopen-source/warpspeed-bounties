# Attachment Summarizer — Architecture Design

## Overview

A Node.js background service that processes email attachment events from an SQS queue,
downloads the attachments from Google Cloud Storage, extracts text content from PDF, DOCX,
TXT, and image files, and generates natural-language summaries using a self-hosted
open-source LLM (Llama 3 / Mistral via Ollama).

## System Flow

```
Email System
    │
    │ (S3/GCS event notification → SQS)
    ▼
┌─────────────────────────────────────────────────────────┐
│                    SQS Queue                            │
│            AttachmentEvent { token, gcsUri }            │
└─────────────────────────────────────────────────────────┘
    │
    │ Poll (long-poll, batch size 10)
    ▼
┌─────────────────────────────────────────────────────────┐
│              sqsConsumer.ts                             │
│  - Receives SQS messages                                │
│  - Parses AttachmentEvent                               │
│  - Passes to orchestrator                               │
│  - Deletes message on success / DLQ on failure          │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│              gcsDownloader.ts                           │
│  - Authenticates via GCP service account (ADC)          │
│  - Downloads file to local temp storage                 │
│  - Returns file path + content-type                     │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│              contentExtractor.ts                        │
│  - Routes on MIME type                                  │
│    ├─ application/pdf  → pdf-parse                     │
│    ├─ application/vnd.openxmlformats-officedocument     │
│    │   .wordprocessingml.document → mammoth            │
│    ├─ text/plain       → fs.readFile                   │
│    └─ image/*          → tesseract OCR                 │
│  - Returns ExtractionResult { text, metadata }          │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│              summarizer.ts                              │
│  - Calls self-hosted LLM (Ollama API)                  │
│  - Constructs prompt with extracted text               │
│  - Returns Summary { id, summary, createdAt }           │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL via Prisma                      │
│  - Stores Attachment, ExtractionResult, Summary         │
│  - Enables idempotency dedup by SQS message ID          │
└─────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. SQS Consumer (`sqsConsumer.ts`)
- Long-polls SQS in an infinite loop (configurable interval).
- Parses `AttachmentEvent` from message body.
- Runs the full pipeline: download → extract → summarize → persist.
- On success: deletes the message from SQS.
- On failure after retries: sends to DLQ (configured at queue level).
- Uses `@aws-sdk/client-sqs`.

### 2. GCS Downloader (`gcsDownloader.ts`)
- Parses `gs://bucket/path` URIs.
- Streams files to a temp directory using `@google-cloud/storage`.
- Cleans up temp files after processing.
- Returns local path and detected MIME type.

### 3. Content Extractor (`contentExtractor.ts`)
- Routes by MIME type to the appropriate extraction engine.
- PDF: `pdf-parse` (PDF.js-based, extracts text).
- DOCX: `mammoth` (converts DOCX to raw text).
- TXT: Direct `fs.readFile` + UTF-8 decode.
- Images (JPEG, PNG, TIFF): `tesseract.js` OCR.
- Returns a normalized `ExtractionResult`.

### 4. Summarizer (`summarizer.ts`)
- Constructs a prompt with the extracted text and a summarization instruction.
- Calls Ollama REST API (`http://localhost:11434/api/generate`).
- Model: `llama3.1:8b` or `mistral:7b` (configurable).
- Configures max tokens, temperature, prompt template.
- Parses and returns the generated summary text.

### 5. Database (Prisma + PostgreSQL)
- Tracks each attachment's processing state.
- Avoids duplicate processing via SQS message dedup ID.
- Stores raw extracted text and the final summary.

## Data Flow (Sequence)

```
SQS ──► sqsConsumer ──► gcsDownloader ──► contentExtractor ──► summarizer ──► Prisma
  │         │               │                   │                   │            │
  │    parse event      download file       extract text         call LLM    persist
  │    delete msg       cleanup temp        return text          return       ack
```

## Error Handling & Retry

| Layer | Strategy |
|-------|----------|
| SQS   | Visibility timeout (30s); message goes to DLQ after 3 receives |
| GCS   | Retry with exponential backoff (3 attempts) |
| Extraction | Catch per-file errors; skip unsupported types gracefully |
| LLM   | Retry on 5xx / timeout (2 attempts); fallback to truncated summary |

## Security Considerations

- GCS access via Workload Identity Federation or service account key (ADC).
- SQS access via IAM role with least-privilege policy.
- LLM runs on localhost — no network exposure.
- Temp files cleaned immediately after extraction.
- No secrets in code — all via environment variables.

## Deployment

- Docker container deployed to Cloud Run (or ECS Fargate).
- Single-process, no HTTP server needed (background worker).
- Configure `SQS_QUEUE_URL`, `GOOGLE_APPLICATION_CREDENTIALS`, `DATABASE_URL`, `OLLAMA_BASE_URL`.

## Scaling

- Horizontally scalable: each instance polls the same SQS queue.
- SQS visibility timeout must exceed max processing time per message.
- Use SQS batch size of 10 for throughput.
