import { PrismaClient } from "@prisma/client";
import { AttachmentEvent, AttachmentSummary, ExtractedContent } from "../types.js";

export class AttachmentRepository {
  constructor(private readonly prisma = new PrismaClient()) {}

  async markProcessing(event: AttachmentEvent) {
    return this.prisma.attachmentJob.upsert({
      where: { eventId: event.eventId },
      create: {
        eventId: event.eventId,
        messageId: event.messageId,
        bucket: event.bucket,
        objectName: event.objectName,
        gcsGeneration: event.gcsGeneration,
        filename: event.filename,
        mimeType: event.mimeType,
        sizeBytes: event.sizeBytes,
        status: "PROCESSING",
        attempts: 1,
      },
      update: {
        status: "PROCESSING",
        attempts: { increment: 1 },
        errorMessage: null,
      },
    });
  }

  async markCompleted(
    eventId: string,
    extracted: ExtractedContent,
    summary: AttachmentSummary,
  ) {
    return this.prisma.attachmentJob.update({
      where: { eventId },
      data: {
        status: "COMPLETED",
        extractedText: extracted.text,
        summary: summary.summary,
        summaryModel: summary.model,
        completedAt: new Date(),
      },
    });
  }

  async markFailed(eventId: string, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return this.prisma.attachmentJob.update({
      where: { eventId },
      data: {
        status: "FAILED",
        errorMessage: message.slice(0, 2000),
      },
    });
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

