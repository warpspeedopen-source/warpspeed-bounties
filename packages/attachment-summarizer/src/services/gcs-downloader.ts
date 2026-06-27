import { Storage } from '@google-cloud/storage';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import logger from '../lib/logger';

export interface GcsDownloaderOptions {
  serviceAccountKey: string;
  tempDir: string;
  maxFileSizeBytes: number;
}

/**
 * Downloads attachments from Google Cloud Storage to local temp directory.
 */
export class GcsDownloader {
  private storage: Storage;
  private options: GcsDownloaderOptions;

  constructor(options: GcsDownloaderOptions) {
    // If serviceAccountKey is provided as JSON string, parse it
    // Otherwise rely on GOOGLE_APPLICATION_CREDENTIALS env var
    if (options.serviceAccountKey) {
      try {
        const credentials = JSON.parse(options.serviceAccountKey);
        this.storage = new Storage({ credentials });
      } catch {
        // Assume it's a file path
        this.storage = new Storage({ keyFilename: options.serviceAccountKey });
      }
    } else {
      this.storage = new Storage();
    }
    this.options = options;
  }

  /**
   * Download an attachment from GCS to a local temp file.
   * Returns the local file path.
   */
  async download(bucketName: string, storageKey: string, fileName: string): Promise<string> {
    const localDir = path.join(this.options.tempDir, path.dirname(storageKey));
    await fs.mkdir(localDir, { recursive: true });

    const localPath = path.join(this.options.tempDir, storageKey);
    const bucket = this.storage.bucket(bucketName);
    const file = bucket.file(storageKey);

    // Check file size before downloading
    const [metadata] = await file.getMetadata();
    const fileSize = parseInt(metadata.size ?? '0', 10);

    if (fileSize > this.options.maxFileSizeBytes) {
      throw new Error(
        `File too large: ${fileSize} bytes exceeds limit of ${this.options.maxFileSizeBytes} bytes`
      );
    }

    logger.info({ bucketName, storageKey, fileName, fileSize }, 'Downloading from GCS');

    const writeStream = createWriteStream(localPath);
    const readStream = file.createReadStream();

    try {
      await pipeline(readStream, writeStream);
    } catch (error) {
      // Clean up partial download
      await fs.unlink(localPath).catch(() => {});
      throw error;
    }

    logger.info({ localPath, fileSize }, 'Download complete');

    return localPath;
  }

  /**
   * Clean up a downloaded temp file.
   */
  async cleanup(localPath: string): Promise<void> {
    try {
      await fs.unlink(localPath);
      logger.debug({ localPath }, 'Cleaned up temp file');
    } catch (error) {
      logger.warn({ err: error, localPath }, 'Failed to clean up temp file');
    }
  }
}

export default GcsDownloader;
