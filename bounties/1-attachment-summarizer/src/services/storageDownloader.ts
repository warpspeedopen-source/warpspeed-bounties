import { Storage } from '@google-cloud/storage';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger';

export class StorageDownloader {
  private storage: Storage;

  constructor() {
    try {
      const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT;

      const config: any = {};
      if (keyFilename) {
        config.keyFilename = keyFilename;
        logger.info('Initializing Google Cloud Storage with keyFilename', { keyFilename });
      } else {
        logger.info('Initializing Google Cloud Storage with Application Default Credentials (ADC)');
      }
      if (projectId) {
        config.projectId = projectId;
      }

      this.storage = new Storage(config);
    } catch (error) {
      logger.error('Failed to initialize Google Cloud Storage client', error);
      throw error;
    }
  }

  /**
   * Downloads a file from Google Cloud Storage to a local temporary path.
   * @param bucketName GCS bucket name
   * @param srcFileName GCS object key
   * @param destDir Target directory on local filesystem (optional, defaults to ./temp)
   * @returns Path to the downloaded file
   */
  public async downloadFile(bucketName: string, srcFileName: string, destDir?: string): Promise<string> {
    logger.info(`Starting download of gs://${bucketName}/${srcFileName}`);
    
    try {
      const targetDir = destDir || path.join(process.cwd(), 'temp');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        logger.debug('Created temporary directory for downloads', { targetDir });
      }

      // Generate a safe local filename to avoid directory traversal
      const safeFileName = path.basename(srcFileName);
      const localFilePath = path.join(targetDir, `${Date.now()}_${safeFileName}`);

      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(srcFileName);

      // Check if file exists first to avoid vague stream errors
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`File 'gs://${bucketName}/${srcFileName}' does not exist in Google Cloud Storage.`);
      }

      logger.debug('Downloading file to local path', { localFilePath });

      await file.download({ destination: localFilePath });

      logger.info('Successfully downloaded file from GCS', {
        gcsPath: `gs://${bucketName}/${srcFileName}`,
        localFilePath,
        sizeBytes: fs.statSync(localFilePath).size
      });

      return localFilePath;
    } catch (error) {
      logger.error('Failed to download file from Google Cloud Storage', error, {
        bucketName,
        srcFileName
      });
      throw error;
    }
  }
}
