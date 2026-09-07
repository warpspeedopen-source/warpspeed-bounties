/**
 * Centralized configuration loader. Reads environment variables,
 * validates them with zod, and exposes a strongly-typed config object.
 */

import "dotenv/config";
import { z } from "zod";

const ConfigSchema = z.object({
  // Required
  SQS_QUEUE_URL: z.string().url(),
  GCS_BUCKET: z.string().min(1),
  DATABASE_URL: z.string().min(1),

  // Optional with defaults
  OLLAMA_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("llama3"),
  AWS_REGION: z.string().default("us-east-1"),

  // Polling / runtime
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  POLL_WAIT_SECONDS: z.coerce.number().int().min(0).max(20).default(20),
  POLL_VISIBILITY_TIMEOUT: z.coerce.number().int().positive().default(120),

  // Extraction limits
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(50 * 1024 * 1024),
  MAX_EXTRACTED_CHARS: z.coerce.number().int().positive().default(200_000),
  TEMP_DIR: z.string().default("/tmp/attachment-summarizer"),

  // Logging
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug"])
    .default("info"),

  // AWS endpoint override for localstack
  AWS_ENDPOINT_URL: z.string().url().optional(),

  // GCS emulator
  GCS_EMULATOR_HOST: z.string().optional(),

  // Optional: GCS service-account key file path
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

let cached: Config | null = null;

export function loadConfig(): Config {
  if (cached) return cached;
  const parsed = ConfigSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/**
 * Reset cached config — used by tests after mutating process.env.
 */
export function resetConfig(): void {
  cached = null;
}