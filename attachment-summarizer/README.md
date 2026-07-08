# Attachment Summarizer Service

$960 warpSpeed bounty - Node.js/TypeScript service that summarizes email attachments.

## Setup (3 steps)

1. `npm install`
2. `cp .env.example .env` - configure AWS, GCS, Ollama
3. `npm start`

## Docker

```bash
docker build -t attachment-summarizer .
docker run --env-file .env attachment-summarizer
```

## Supported Formats

- PDF, Word, Excel, HTML, Plain Text

## Architecture

SQS -> Consumer -> GCS -> Extractor -> Ollama LLM -> Summary
