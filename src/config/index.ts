import { z } from 'zod';

const configSchema = z.object({
  aws: z.object({
    region: z.string().default('us-east-1'),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    sqsQueueUrl: z.string(),
  }),
  gcs: z.object({
    projectId: z.string(),
    keyFilename: z.string().optional(),
  }),
  ollama: z.object({
    host: z.string().default('http://localhost:11434'),
    model: z.string().default('llama2'),
  }),
  database: z.object({
    url: z.string(),
  }),
  server: z.object({
    port: z.number().default(3000),
  }),
});

export const config = configSchema.parse({
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sqsQueueUrl: process.env.AWS_SQS_QUEUE_URL,
  },
  gcs: {
    projectId: process.env.GCS_PROJECT_ID,
    keyFilename: process.env.GCS_KEY_FILENAME,
  },
  ollama: {
    host: process.env.OLLAMA_HOST,
    model: process.env.OLLAMA_MODEL,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
});