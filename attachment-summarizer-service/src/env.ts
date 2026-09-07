import dotenv from 'dotenv';

dotenv.config();

export const env = {
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  SQS_QUEUE_URL: process.env.SQS_QUEUE_URL || '',
  GCS_PROJECT_ID: process.env.GCS_PROJECT_ID || '',
  GCS_CLIENT_EMAIL: process.env.GCS_CLIENT_EMAIL || '',
  GCS_PRIVATE_KEY: process.env.GCS_PRIVATE_KEY ? process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'llama3', // or llava for vision
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
};
