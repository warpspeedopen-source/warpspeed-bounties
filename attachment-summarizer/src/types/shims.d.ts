/**
 * Ambient module declarations for libraries that ship without their
 * own .d.ts files.
 */

declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    text: string;
    numpages?: number;
    info?: Record<string, unknown>;
    metadata?: unknown;
    version?: string;
  }
  const fn: (buffer: Buffer) => Promise<PdfParseResult>;
  export default fn;
}