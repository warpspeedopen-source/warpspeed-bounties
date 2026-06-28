import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AWS_REGION: z.string().min(1).default("us-east-1"),
  SQS_QUEUE_URL: z.string().url(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GCS_BUCKET: z.string().min(1),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().min(1).default("llama3.1:8b"),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().max(20).default(4),
  SQS_WAIT_TIME_SECONDS: z.coerce.number().int().min(1).max(20).default(20),
  SQS_VISIBILITY_TIMEOUT_SECONDS: z.coerce.number().int().min(30).max(43200).default(120),
  MAX_ATTACHMENT_BYTES: z.coerce.number().int().positive().default(25 * 1024 * 1024),
  OCR_IMAGES: z.coerce.boolean().default(true),
  LOG_LEVEL: z.string().default("info"),
});

export const config = envSchema.parse(process.env);

