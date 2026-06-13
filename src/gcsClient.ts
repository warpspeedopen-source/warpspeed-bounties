import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import os from 'os';
import path from 'path';

const storage = new Storage();

export async function downloadFromGCS(bucket: string, object: string): Promise<string> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gcs-'));
  const destPath = path.join(tempDir, path.basename(object));
  await storage.bucket(bucket).file(object).download({ destination: destPath });
  return destPath;
}