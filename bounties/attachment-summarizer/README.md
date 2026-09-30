# Attachment Summarizer

Worker for warpSpeed bounty issue #1. It reads attachment events from SQS, downloads the object from Google Cloud Storage, extracts text, and asks a local Ollama model for a short factual summary.

Supported types: plain text, CSV, Markdown, JSON, HTML, PDF text objects, DOCX, XLSX shared strings, and images. Images are described by type and size. There is no OCR step.

A failed extract or summary leaves the SQS message in place so the queue can retry it. A repeated event id is deleted without calling the model again.

## Test

```bash
npm test
```

Tests use in-memory queue, blob, and summary doubles. They do not call AWS, GCS, or Ollama.

## Run

Set `SQS_QUEUE_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `GCS_ACCESS_TOKEN`, and optionally `OLLAMA_URL` / `OLLAMA_MODEL`. Then:

```bash
npm start
```

`node --experimental-strip-types src/index.ts --once` processes a single receive and exits. `prisma/schema.prisma` is the Postgres record for a deployed store. The default process keeps summaries in memory.

```bash
docker compose up --build
```
