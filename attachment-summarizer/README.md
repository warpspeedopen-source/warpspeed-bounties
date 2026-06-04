# Attachment Summarizer Service

Consumes attachment events from AWS SQS, downloads files from Google Cloud Storage, extracts content, and summarizes it using a self-hosted open-source LLM via Ollama.

## Setup

```bash
docker-compose up -d
```

## Environment Variables

- `DATABASE_URL`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SQS_QUEUE_URL`
- `GCS_PROJECT_ID`
- `OLLAMA_API_URL`
- `OLLAMA_MODEL`

## Tests

```bash
npm test
```
