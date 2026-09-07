/**
 * File content extractors. Each extractor accepts a buffer (or path)
 * and returns the extracted plain text plus a content hash.
 *
 * Supported formats:
 *   - PDF          → pdf-parse
 *   - DOCX         → mammoth
 *   - XLSX / XLS   → xlsx (converted to CSV per sheet)
 *   - TXT          → utf-8 decode
 *   - HTML         → strip tags, decode entities
 *   - Images       → tesseract.js OCR
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { Buffer } from "node:buffer";
import type { ExtractResult, FileKind } from "./types.js";

/**
 * Pick the file kind from a filename or mime-type hint.
 */
export function detectFileKind(fileName: string, mimeType?: string): FileKind {
  const lower = fileName.toLowerCase();
  const ext = extname(lower).replace(/^\./, "");
  const mime = (mimeType ?? "").toLowerCase();

  if (ext === "pdf" || mime === "application/pdf") return "pdf";
  if (ext === "docx" || mime.includes("wordprocessingml")) return "docx";
  if (ext === "xlsx" || ext === "xls" || mime.includes("spreadsheetml")) return "xlsx";
  if (ext === "csv" || mime === "text/csv") return "csv";
  if (ext === "html" || ext === "htm" || mime === "text/html") return "html";
  if (ext === "txt" || mime === "text/plain" || mime.startsWith("text/")) return "txt";

  if (
    ext === "png" ||
    ext === "jpg" ||
    ext === "jpeg" ||
    ext === "gif" ||
    ext === "webp" ||
    ext === "tiff" ||
    mime.startsWith("image/")
  ) {
    return "image";
  }

  return "unknown";
}

function hashBuffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

/** Strip simple HTML tags and decode a handful of common entities. */
export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lazy loader so missing deps don't break the module on import. */
async function pdfBuffer(buf: Buffer): Promise<string> {
  // pdf-parse has a default `index.js` that runs a debug read on import.
  // We import the underlying lib directly to avoid that side-effect.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("pdf-parse/lib/pdf-parse.js");
  const fn = mod.default ?? mod;
  const result = await fn(buf);
  return result?.text ?? "";
}

async function docxBuffer(buf: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth: any = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: buf });
  return result?.value ?? "";
}

async function xlsxBuffer(buf: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const xlsx: any = await import("xlsx");
  const wb = xlsx.read(buf, { type: "buffer" });
  const parts: string[] = [];
  for (const sheetName of wb.SheetNames as string[]) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    parts.push(`# Sheet: ${sheetName}`);
    const csv = xlsx.utils.sheet_to_csv(sheet);
    parts.push(csv);
  }
  return parts.join("\n\n");
}

async function imageBuffer(
  buf: Buffer,
  _mimeType: string,
): Promise<string> {
  // sharp is used to normalize the image (decode + re-encode as PNG).
  // This keeps tesseract.js happy with predictable input.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sharpMod: any = await import("sharp");
  const sharp = sharpMod.default ?? sharpMod;
  const normalized = await sharp(buf).png().toBuffer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tesseract: any = await import("tesseract.js");
  const worker = await tesseract.createWorker("eng");
  try {
    const ret = await worker.recognize(normalized);
    // tesseract.js v5 returns { data: { text } }.
    const text = ret?.data?.text ?? "";
    return text;
  } finally {
    await worker.terminate();
  }
}

function textBuffer(buf: Buffer): string {
  return buf.toString("utf8");
}

/**
 * Extract text from an in-memory buffer given the original filename
 * and an optional mime-type hint.
 */
export async function extractBuffer(
  buf: Buffer,
  fileName: string,
  mimeType?: string,
): Promise<ExtractResult> {
  const kind = detectFileKind(fileName, mimeType);
  const contentHash = hashBuffer(buf);
  let text = "";

  switch (kind) {
    case "pdf":
      text = await pdfBuffer(buf);
      break;
    case "docx":
      text = await docxBuffer(buf);
      break;
    case "xlsx":
    case "csv":
      text = await xlsxBuffer(buf);
      break;
    case "html":
      text = stripHtml(buf.toString("utf8"));
      break;
    case "txt":
      text = textBuffer(buf);
      break;
    case "image":
      text = await imageBuffer(buf, mimeType ?? "image/png");
      break;
    case "unknown":
    default:
      throw new Error(`Unsupported file kind for "${fileName}"`);
  }

  return {
    text: text.trim(),
    contentHash,
    detectedType: kind,
  };
}

/**
 * Convenience wrapper: read a file from disk and extract.
 */
export async function extractFile(
  filePath: string,
  fileName: string,
  mimeType?: string,
): Promise<ExtractResult> {
  const buf = await readFile(filePath);
  return extractBuffer(buf, fileName, mimeType);
}