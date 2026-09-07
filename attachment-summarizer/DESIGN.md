# Attachment Summarizer — Design

## Overview

The Attachment Summarizer is a worker service that converts arbitrary
file attachments into concise factual summaries. It is the canonical
implementation of warpspeed-bounties issue #1.

## Goals

- **Pluggable sources** — receive work from any SQS-compatible queue.
- **Pluggable storage** — fetch bytes from GCS (`gs://` or
  `https://storage.googleapis.com/...`).
- **Local LLM** — use Ollama for summaries so no cloud LLM bills are
  required.
- **Strong typing** — TypeScript strict mode, zod-validated config.
- **Observable** — every stage emits a structured log line tagged with
  the originating `messageId`.
- **Resilient** — transient failures retry via SQS; permanent ones
  are persisted in `Summary.error`.

## Non-goals

- Cloud-managed LLM integrations (Bedrock, OpenAI, etc.) — explicitly
  out of scope; Ollama is the only summarizer for now.
- Real-time push to clients — summaries are stored, not streamed
  back to upstream.
- Auth on the SQS consumer — production deployments should run it
  behind IAM roles.

## Pipeline

```
SQS -> parse -> GCS download -> extract -> Ollama summarize -> persist
                            \________________  errors  _____________/
                                                |
                                                v
                                          Summary.status = FAILED
```

Each stage updates the `Summary` row so operators can audit progress
and failures without log diving.

## Data model

`Summary` (see `prisma/schema.prisma`):

- `id` (uuid) — primary key.
- `messageId` — unique; used for idempotent upserts.
- `fileName`, `fileType`, `fileSize` — copied from the event.
- `contentHash` — SHA-256 of the original file bytes.
- `originalText` — extracted text (truncated to `MAX_EXTRACTED_CHARS`).
- `summary` — final LLM output.
- `status` — see Pipeline above.
- `error` — populated when `status = FAILED`.
- `createdAt` / `updatedAt` — managed by Prisma.

## Concurrency model

- A single long-running process polls SQS in a `while (!aborted)`
  loop.
- Each received batch is processed in parallel via `Promise.all`.
- Failures from one message do not abort the rest of the batch.
- Shutdown is signal-driven (`SIGTERM` / `SIGINT`); the AbortController
  causes the loop to exit between iterations.

## Future work

- Multi-model summarization (e.g. long-context model for big PDFs).
- Embedding generation for semantic search of historical summaries.
- Plug-in extractor registry (so contributors can add new formats
  without touching the core pipeline).
- Outbox-style publishing of summary events back to SQS / webhooks.

---

See [`README.md`](./README.md) for setup, run, and configuration
details.