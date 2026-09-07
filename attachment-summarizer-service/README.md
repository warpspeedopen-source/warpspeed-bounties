# Attachment Summarizer Service

A Node.js attachment summarizer service that consumes email attachment events from AWS SQS, downloads attachments from Google Cloud Storage, extracts content from supported file types (PDF, Word, Excel, HTML, Text, Images), and generates natural-language summaries using a locally hosted LLM (Ollama).

## Prerequisites

- Node.js 18+
- Docker
- Ollama installed and running (with `llama3` or your preferred model)
- AWS and GCP credentials

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file based on `.env.example`:
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/MyQueue
   GCS_PROJECT_ID=your_gcp_project
   GCS_CLIENT_EMAIL=your_gcp_email@project.iam.gserviceaccount.com
   GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=llama3
   DATABASE_URL=file:./dev.db
   ```

3. **Database initialization:**
   ```bash
   npx prisma db push
   ```

4. **Run the service:**
   ```bash
   npm start
   ```

## Docker

Build and run using Docker:

```bash
docker build -t attachment-summarizer .
docker run --env-file .env -v $(pwd)/prisma:/app/prisma attachment-summarizer
```
