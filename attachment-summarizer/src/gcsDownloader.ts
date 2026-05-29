import { Storage } from '@google-cloud/storage';
import { config } from './config';
import * as path from 'path';
import * as os from 'os';

const storage = new Storage({ projectId: config.gcsProjectId });

export async function downloadFromGCS(bucketName: string, objectKey: string): Promise<string> {
  const destPath = path.join(os.tmpdir(), `attachment-${Date.now()}-${path.basename(objectKey)}`);
  
  await storage.bucket(bucketName).file(objectKey).download({ destination: destPath });
  
  return destPath;
}
