import { AppConfig } from '../types';

/**
 * Load application configuration from environment variables with sensible defaults.
 */
export function loadConfig(): AppConfig {
  return {
    aws: {
      region: process.env.AWS_REGION ?? 'us-east-1',
      sqsQueueUrl: process.env.SQS_QUEUE_URL ?? '',
      sqsPollIntervalMs: parseInt(process.env.SQS_POLL_INTERVAL_MS ?? '10000', 10),
      sqsMaxMessages: parseInt(process.env.SQS_MAX_MESSAGES ?? '10', 10),
      sqsVisibilityTimeout: parseInt(process.env.SQS_VISIBILITY_TIMEOUT ?? '300', 10),
    },
    gcs: {
      serviceAccountKey: process.env.GCS_SERVICE_ACCOUNT_KEY ?? '',
    },
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL ?? 'llama3',
      timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS ?? '60000', 10),
    },
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    },
    database: {
      url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/warpspeed',
    },
    processing: {
      maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_BYTES ?? '10485760', 10), // 10MB
      tempDir: process.env.TEMP_DIR ?? '/tmp/attachments',
      maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS ?? '5', 10),
    },
  };
}

export default loadConfig;
