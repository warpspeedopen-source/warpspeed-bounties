import { describe, expect, it } from "vitest";
import { attachmentEventSchema } from "../src/types.js";

describe("attachmentEventSchema", () => {
  it("accepts the required SQS event shape", () => {
    const event = attachmentEventSchema.parse({
      eventId: "evt_123",
      messageId: "msg_123",
      bucket: "mail-attachments",
      objectName: "inbox/user/report.pdf",
      filename: "report.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
    });

    expect(event.eventId).toBe("evt_123");
  });

  it("rejects missing GCS object names", () => {
    expect(() =>
      attachmentEventSchema.parse({
        eventId: "evt_123",
        bucket: "mail-attachments",
        filename: "report.pdf",
      }),
    ).toThrow();
  });
});

