import { z } from "zod";

export const attachmentEventSchema = z.object({
  eventId: z.string().min(1),
  messageId: z.string().optional(),
  bucket: z.string().min(1),
  objectName: z.string().min(1),
  gcsGeneration: z.string().optional(),
  filename: z.string().min(1),
  mimeType: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
});

export type AttachmentEvent = z.infer<typeof attachmentEventSchema>;

export type ExtractedContent = {
  text: string;
  detectedType: string;
  pagesOrSheets?: number;
  warnings: string[];
};

export type AttachmentSummary = {
  summary: string;
  model: string;
  promptTokensEstimate: number;
};

