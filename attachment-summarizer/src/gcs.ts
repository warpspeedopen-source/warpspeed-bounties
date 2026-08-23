import { Storage } from '@google-cloud/storage';

const storage = new Storage();

export async function downloadFromGCS(bucketName: string, fileName: string): Promise<Buffer> {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);
  
  const [buffer] = await file.download();
  return buffer;
}