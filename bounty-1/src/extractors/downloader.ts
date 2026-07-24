import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import { createChildLogger } from '../utils/logger';
import type { AttachmentEvent } from '../models/types';

const log = createChildLogger('downloader');

/** Download an attachment to a local temp file */
export async function downloadAttachment(
  event: AttachmentEvent,
): Promise<string> {
  const tmpDir = os.tmpdir();
  const localPath = path.join(tmpDir, `attachment-${uuidv4()}-${event.fileName}`);

  if (event.bucket && event.objectPath) {
    log.info(`Downloading from GCS: gs://${event.bucket}/${event.objectPath}`);
    await downloadFromGCS(event.bucket, event.objectPath, localPath);
  } else if (event.sourceUrl) {
    log.info(`Downloading from URL: ${event.sourceUrl}`);
    await downloadFromUrl(event.sourceUrl, localPath);
  } else {
    throw new Error('No source URL or GCS path provided in event');
  }

  log.info(`Attachment saved to ${localPath}`);
  return localPath;
}

/** Download a file from a direct URL */
async function downloadFromUrl(url: string, destination: string): Promise<void> {
  const response = await axios({
    method: 'GET',
    url,
    responseType: 'stream',
    timeout: 120_000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Warpspeed-Attachment-Summarizer/1.0',
    },
  });

  const writer = fs.createWriteStream(destination);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

/** Download a file from Google Cloud Storage */
async function downloadFromGCS(
  bucket: string,
  objectPath: string,
  destination: string,
): Promise<void> {
  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: process.env.GCS_CLIENT_EMAIL
      ? {
          client_email: process.env.GCS_CLIENT_EMAIL,
          private_key: (process.env.GCS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }
      : undefined,
  });

  await storage.bucket(bucket).file(objectPath).download({ destination });
}

/** Clean up a downloaded temp file */
export async function cleanupAttachment(localPath: string): Promise<void> {
  try {
    await fs.unlink(localPath);
    log.debug(`Cleaned up ${localPath}`);
  } catch (err) {
    log.warn(`Failed to clean up ${localPath}: ${err}`);
  }
}
