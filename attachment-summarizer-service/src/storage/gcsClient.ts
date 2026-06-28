import { Storage } from "@google-cloud/storage";
import { config } from "../config.js";
import { AttachmentEvent } from "../types.js";

export class GcsAttachmentClient {
  private readonly storage = new Storage({
    projectId: config.GOOGLE_CLOUD_PROJECT,
  });

  async download(event: AttachmentEvent): Promise<Buffer> {
    const bucketName = event.bucket || config.GCS_BUCKET;
    const file = this.storage.bucket(bucketName).file(event.objectName, {
      generation: event.gcsGeneration,
    });
    const [bytes] = await file.download();
    if (bytes.length > config.MAX_ATTACHMENT_BYTES) {
      throw new Error(`Attachment exceeds MAX_ATTACHMENT_BYTES: ${bytes.length}`);
    }
    return bytes;
  }
}

