import dotenv from 'dotenv';

dotenv.config();

export const config = {
  databaseUrl: process.env.DATABASE_URL || '',
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  sqsQueueUrl: process.env.SQS_QUEUE_URL || '',
  ollamaApiUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
  gcsProjectId: process.env.GCS_PROJECT_ID || '',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3', // default model
};
