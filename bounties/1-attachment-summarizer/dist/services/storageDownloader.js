"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageDownloader = void 0;
const storage_1 = require("@google-cloud/storage");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const logger_1 = require("../utils/logger");
class StorageDownloader {
    storage;
    constructor() {
        try {
            const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            const projectId = process.env.GOOGLE_CLOUD_PROJECT;
            const config = {};
            if (keyFilename) {
                config.keyFilename = keyFilename;
                logger_1.logger.info('Initializing Google Cloud Storage with keyFilename', { keyFilename });
            }
            else {
                logger_1.logger.info('Initializing Google Cloud Storage with Application Default Credentials (ADC)');
            }
            if (projectId) {
                config.projectId = projectId;
            }
            this.storage = new storage_1.Storage(config);
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Google Cloud Storage client', error);
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
    async downloadFile(bucketName, srcFileName, destDir) {
        logger_1.logger.info(`Starting download of gs://${bucketName}/${srcFileName}`);
        try {
            const targetDir = destDir || path.join(process.cwd(), 'temp');
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
                logger_1.logger.debug('Created temporary directory for downloads', { targetDir });
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
            logger_1.logger.debug('Downloading file to local path', { localFilePath });
            await file.download({ destination: localFilePath });
            logger_1.logger.info('Successfully downloaded file from GCS', {
                gcsPath: `gs://${bucketName}/${srcFileName}`,
                localFilePath,
                sizeBytes: fs.statSync(localFilePath).size
            });
            return localFilePath;
        }
        catch (error) {
            logger_1.logger.error('Failed to download file from Google Cloud Storage', error, {
                bucketName,
                srcFileName
            });
            throw error;
        }
    }
}
exports.StorageDownloader = StorageDownloader;
