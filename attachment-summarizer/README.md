# Attachment Summarizer

A worker service that consumes attachment events from **Amazon SQS**,
downloads the referenced file from **Google Cloud Storage**, extracts
plain-text content from the supported formats, generates a concise
factual summary via a local **Ollama** LLM, and persists the result
in a relational database (SQLite for local dev, Postgres in production).

This is the implementation for [issue #1 in
warpspeed-bounties](https://github.com/warpspeedopen-source/warpspeed-bounties/issues/1).

---

## Architecture

```
                     +-----------------------+
                     |  Upstream producer    |
                     |  (warpspeed app)      |
                     +-----------+-----------+
                                 |
                                 v  AttachmentEvent JSON
                       +---------+---------+
                       |  Amazon SQS       |
                       |  (long-poll)      |
                       +---------+---------+
                                 |
                                 v
+---------------------+   +-------+--------+
|  attachment-        |   |  GCS Downloader |
|  summarizer worker  +-->|  (gs:// / https)|
+----------+----------+   +-------+--------+
           |                      |
           v                      v
   +-------+--------+   +---------+---------+
   |  Extractor     |   |  Text content     |
   |  PDF/DOCX/XLSX |   |  (PDF, DOCX, ...) |
   |  TXT/HTML/IMG  |   +-------------------+
   +-------+--------+
           |
           v
   +-------+--------+        +-------------------+
   |  Ollama LLM    |------->|  Summary result   |
   |  /api/generate |        |  (3-5 sentences) |
   +-------+--------+        +-------------------+
           |
           v
   +-------+--------+
   |  Prisma / DB   |
   |  (Summaries)   |
   +----------------+
```

## Pipeline stages

| Status        | Description                                   |
|---------------|-----------------------------------------------|
| `PENDING`     | Initial row (set by upstream, optional).      |
| `DOWNLOADING` | Pulling bytes from GCS to a temp file.        |
| `EXTRACTING`  | (Internal — same row transitioned immediately.)|
| `SUMMARIZING` | Ollama is generating the summary.             |
| `COMPLETED`   | Summary persisted.                            |
| `FAILED`      | Error captured in the `error` column.         |

## Supported file types

| Format | Library                  |
|--------|--------------------------|
| PDF    | `pdf-parse`              |
| DOCX   | `mammoth`                |
| XLSX / CSV | `xlsx` (CSV per sheet) |
| TXT    | native UTF-8 decode      |
| HTML   | tag stripper + decoder   |
| Images | `sharp` + `tesseract.js` |

---

## Project layout

```
attachment-summarizer/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config.ts        # zod-validated env loader
│   ├── extractors.ts    # PDF / DOCX / XLSX / TXT / HTML / OCR
│   ├── gcs.ts           # GCS downloader (gs:// + https)
│   ├── index.ts         # entry point + pipeline + signals
│   ├── logger.ts        # winston JSON logger
│   ├── sqs.ts           # SQS long-poll consumer
│   ├── summarizer.ts    # Ollama wrapper (sync + stream)
│   └── types.ts         # shared types
└── tests/
    ├── extractors.test.ts
    ├── sqs.test.ts
    └── summarizer.test.ts
```

---

## Running locally

### 1. Install deps

```bash
npm install
```

### 2. Generate the Prisma client

```bash
npx prisma generate
npx prisma migrate dev --name init   # creates ./dev.db
```

### 3. Start the full stack

```bash
docker compose up --build
```

This spins up Postgres, LocalStack (SQS emulator), Ollama, and the
summarizer service itself.

### 4. Publish a test event

```bash
aws --endpoint-url=http://localhost:4566 sqs send-message \
  --queue-url http://localhost:4566/000000000000/attachment-events \
  --message-body '{
    "messageId": "msg-001",
    "gcsUrl": "https://storage.googleapis.com/attachments/sample.pdf",
    "fileName": "sample.pdf",
    "fileType": "application/pdf",
    "fileSize": 12345
  }'
```

### 5. Inspect the result

```bash
sqlite3 prisma/dev.db 'SELECT messageId, status, summary FROM Summary;'
```

---

## Environment variables

| Name                          | Required | Default                      | Description                                        |
|-------------------------------|----------|------------------------------|----------------------------------------------------|
| `SQS_QUEUE_URL`               | yes      | —                            | Full URL of the SQS queue.                         |
| `GCS_BUCKET`                  | yes      | —                            | Default GCS bucket (URLs may override).             |
| `DATABASE_URL`                | yes      | —                            | Prisma connection string.                          |
| `OLLAMA_URL`                  | no       | `http://localhost:11434`     | Ollama HTTP endpoint.                              |
| `OLLAMA_MODEL`                | no       | `llama3`                     | Model name to call.                                |
| `AWS_REGION`                  | no       | `us-east-1`                  | AWS region for SQS.                                |
| `AWS_ENDPOINT_URL`            | no       | —                            | Override for LocalStack.                           |
| `AWS_ACCESS_KEY_ID`           | prod     | —                            | AWS credentials.                                   |
| `AWS_SECRET_ACCESS_KEY`       | prod     | —                            | AWS credentials.                                   |
| `GOOGLE_APPLICATION_CREDENTIALS` | prod  | —                            | Path to GCS service-account JSON.                  |
| `POLL_WAIT_SECONDS`           | no       | `20`                         | Long-poll wait time.                               |
| `POLL_VISIBILITY_TIMEOUT`     | no       | `120`                        | Visibility timeout for in-flight messages.         |
| `POLL_INTERVAL_MS`            | no       | `5000`                       | Back-off between failed polls.                     |
| `MAX_FILE_SIZE`               | no       | `52428800` (50 MiB)          | Hard limit on downloaded file size.                |
| `MAX_EXTRACTED_CHARS`         | no       | `200000`                     | Truncation cap for LLM input.                      |
| `TEMP_DIR`                    | no       | `/tmp/attachment-summarizer` | Working directory for downloads.                   |
| `LOG_LEVEL`                   | no       | `info`                       | `error` / `warn` / `info` / `debug`.               |

---

## Testing

```bash
npm test
```

Tests use Node's built-in test runner with `tsx` for TypeScript
loading. The SQS tests stub the AWS SDK client; the summarizer
tests inject a fake `fetch`.

---

## Operational notes

- **Idempotency** — each message is keyed by `messageId`. If SQS
  delivers the same message twice, the existing row is updated rather
  than duplicated.
- **Backpressure** — failed messages are *not* deleted; they remain
  in flight until the visibility timeout expires, letting SQS retry
  or route them to a DLQ.
- **Graceful shutdown** — `SIGTERM` / `SIGINT` abort the consumer
  loop, flush the Prisma client, and exit cleanly.

---

## License

MIT — see the parent repository's `LICENSE`.