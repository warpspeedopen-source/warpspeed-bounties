export interface Config {
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    sqs: {
      queueUrl: string;
      waitTimeSeconds: number;
    };
  };
  gcs: {
    projectId: string;
    bucketName: string;
  };
  ollama: {
    baseUrl: string;
    model: string;
  };
  prisma: {
    databaseUrl: string;
  };
  service: {
    pollInterval: number;
    maxRetries: number;
  };
}

export const config: Config = {
  // Configuration will be loaded from environment variables
};