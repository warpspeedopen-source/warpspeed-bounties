import { Storage } from '@google-cloud/storage';
import { createWriteStream, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const storage = new Storage();

interface GcsUriComponents {
  bucket: string;
  path: string;
}

function parseGcsUri(uri: string): GcsUriComponents {
  const match = uri.match(/^gs:\/\/([^/]+)\/(.+)$/);
  if (!match) {
    throw new Error(`Invalid GCS URI: ${uri}`);
  }
  return { bucket: match[1], path: match[2] };
}

export async function downloadFromGcs(gcsUri: string): Promise<string> {
  const { bucket, path } = parseGcsUri(gcsUri);
  const bucketRef = storage.bucket(bucket);
  const fileRef = bucketRef.file(path);

  const [exists] = await fileRef.exists();
  if (!exists) {
    throw new Error(`File not found in GCS: ${gcsUri}`);
  }

  const tempDir = mkdtempSync(join(tmpdir(), 'attachments-'));
  const localPath = join(tempDir, path.split('/').pop() ?? 'download');

  await new Promise<void>((resolve, reject) => {
    const writeStream = createWriteStream(localPath);
    fileRef
      .createReadStream()
      .on('error', reject)
      .pipe(writeStream)
      .on('error', reject)
      .on('finish', resolve);
  });

  return localPath;
}
