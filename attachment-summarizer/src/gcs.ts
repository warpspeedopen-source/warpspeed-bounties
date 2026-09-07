/**
 * Google Cloud Storage downloader. Accepts both gs:// and https://
 * URLs, downloads to a temporary file, and returns the local path.
 */

import { Storage } from "@google-cloud/storage";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Buffer } from "node:buffer";
import type { Logger } from "./types.js";

/**
 * Parse a GCS-style URL into bucket + object components.
 * Throws for unrecognized schemes.
 */
export function parseGcsUrl(url: string): { bucket: string; key: string } {
  if (url.startsWith("gs://")) {
    const rest = url.slice("gs://".length);
    const slash = rest.indexOf("/");
    if (slash <= 0) {
      throw new Error(`Invalid gs:// URL: ${url}`);
    }
    return {
      bucket: rest.slice(0, slash),
      key: rest.slice(slash + 1),
    };
  }
  if (url.startsWith("https://") || url.startsWith("http://")) {
    const u = new URL(url);
    // Support https://storage.googleapis.com/<bucket>/<key>
    const hostMatch = u.hostname.endsWith("storage.googleapis.com");
    if (hostMatch) {
      const segments = u.pathname.replace(/^\/+/, "").split("/");
      const bucket = segments.shift();
      if (!bucket) throw new Error(`Invalid GCS https URL: ${url}`);
      return { bucket, key: segments.join("/") };
    }
    throw new Error(`Unsupported URL host for GCS: ${u.hostname}`);
  }
  throw new Error(`Unrecognized URL scheme: ${url}`);
}

export interface DownloaderOptions {
  bucket?: string;
  tempDir?: string;
  logger: Logger;
}

/**
 * Create a downloader instance. The bucket name is optional —
 * if provided, callers can pass plain object keys instead of full URLs.
 */
export class GcsDownloader {
  private readonly storage: Storage;
  private readonly bucket: string;
  private readonly tempDir: string;
  private readonly logger: Logger;

  constructor(opts: DownloaderOptions) {
    this.storage = new Storage();
    this.bucket = opts.bucket ?? "";
    this.tempDir = opts.tempDir ?? tmpdir();
    this.logger = opts.logger;
  }

  /**
   * Download an object to a fresh temporary directory. The caller is
   * responsible for cleaning up the returned directory.
   */
  async download(urlOrKey: string, fileNameHint?: string): Promise<{
    dir: string;
    path: string;
    size: number;
    contentType?: string;
  }> {
    let bucket: string;
    let key: string;

    if (urlOrKey.startsWith("gs://") || urlOrKey.startsWith("http")) {
      const parsed = parseGcsUrl(urlOrKey);
      bucket = parsed.bucket;
      key = parsed.key;
    } else {
      bucket = this.bucket;
      key = urlOrKey;
    }

    if (!bucket) {
      throw new Error("Bucket is required for bare object keys; pass an explicit URL or bucket.");
    }

    this.logger.info("GCS download starting", { bucket, key });

    const dir = await mkdtemp(join(this.tempDir, "gcs-"));
    const safeName = fileNameHint ?? key.split("/").pop() ?? "attachment";
    const localPath = join(dir, safeName);

    try {
      const file = this.storage.bucket(bucket).file(key);
      const [buf] = await file.download();
      await writeFile(localPath, buf as Buffer);

      const [meta] = await file.getMetadata().catch(() => [undefined]);
      const contentType =
        meta && typeof meta === "object" && "contentType" in meta
          ? (meta as { contentType?: string }).contentType
          : undefined;

      this.logger.info("GCS download completed", {
        bucket,
        key,
        bytes: buf.length,
      });

      return { dir, path: localPath, size: buf.length, contentType };
    } catch (err) {
      // Clean up the temp dir on failure.
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
      throw err;
    }
  }
}

/**
 * Convenience helper: download a file and call `fn` with the
 * local path, then clean up afterwards.
 */
export async function withDownloadedFile<T>(
  downloader: GcsDownloader,
  url: string,
  fileName: string,
  fn: (path: string) => Promise<T>,
): Promise<T> {
  const result = await downloader.download(url, fileName);
  try {
    return await fn(result.path);
  } finally {
    await rm(result.dir, { recursive: true, force: true }).catch(() => undefined);
  }
}