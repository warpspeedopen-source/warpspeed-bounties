import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  keyFilename: process.env.GCP_CREDENTIALS_PATH,
});

export const downloadFile = async (bucketName: string, filePath: string): Promise<Buffer> => {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(filePath);
  const [buffer] = await file.download();
  return buffer;
};
