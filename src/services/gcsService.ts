import { Storage } from '@google-cloud/storage';
import { config } from '../config';
import { logger } from '../utils/logger';

export class GcsService {
  private storage: Storage;
  private bucket: any;

  constructor() {
    this.storage = new Storage({
      projectId: config.gcs.projectId,
      keyFilename: config.gcs.keyFilename,
    });
    this.bucket = this.storage.bucket(config.gcs.bucketName);
  }

  async downloadFile(gcsPath: string): Promise<Buffer> {
    try {
      const file = this.bucket.file(gcsPath);
      const [contents] = await file.download();
      return contents;
    } catch (error) {
      logger.error('Error downloading file from GCS', { gcsPath, error });
      throw new Error('Failed to download file from GCS');
    }
  }
}