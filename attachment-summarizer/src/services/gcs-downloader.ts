import { Storage } from '@google-cloud/storage';
import { logger } from '../utils/logger';
import { ExtractionResult } from '../types';

const storage = new Storage();

export async function downloadFromGCS(
  bucketName: string,
  objectPath: string
): Promise<Buffer> {
  logger.info(`Downloading from GCS: ${bucketName}/${objectPath}`);

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(objectPath);

  const [buffer] = await file.download();

  logger.info(`Downloaded ${buffer.length} bytes`);
  return buffer;
}
