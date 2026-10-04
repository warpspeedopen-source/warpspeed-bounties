import dotenv from 'dotenv';

dotenv.config();

export const config = {
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    sqsUrl: process.env.AWS_SQS_URL || '',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  gcs: {
    projectId: process.env.GCS_PROJECT_ID || '',
    keyFilename: process.env.GCS_KEY_FILENAME || '',
    bucketName: process.env.GCS_BUCKET_NAME || '',
  },
  ollama: {
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama2',
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.2'),
    maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '512'),
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};