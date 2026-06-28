import * as cheerio from "cheerio";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import Tesseract from "tesseract.js";
import xlsx from "xlsx";
import { config } from "../config.js";
import { AttachmentEvent, ExtractedContent } from "../types.js";

const TEXT_EXTENSIONS = new Set([".txt", ".md", ".json", ".xml", ".log"]);
const CSV_EXTENSIONS = new Set([".csv", ".tsv"]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"]);

export function extensionOf(filename: string): string {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

export async function extractAttachment(
  event: AttachmentEvent,
  bytes: Buffer,
): Promise<ExtractedContent> {
  const ext = extensionOf(event.filename);
  const mime = (event.mimeType ?? "").toLowerCase();
  const warnings: string[] = [];

  if (mime.includes("html") || ext === ".html" || ext === ".htm") {
    return {
      text: extractHtml(bytes.toString("utf8")),
      detectedType: "html",
      warnings,
    };
  }

  if (mime.startsWith("text/") || TEXT_EXTENSIONS.has(ext)) {
    return { text: bytes.toString("utf8"), detectedType: "text", warnings };
  }

  if (CSV_EXTENSIONS.has(ext) || mime.includes("csv")) {
    return { text: extractCsv(bytes.toString("utf8")), detectedType: "csv", warnings };
  }

  if (ext === ".pdf" || mime === "application/pdf") {
    const parsed = await pdfParse(bytes);
    return {
      text: parsed.text,
      detectedType: "pdf",
      pagesOrSheets: parsed.numpages,
      warnings,
    };
  }

  if (ext === ".docx" || mime.includes("wordprocessingml")) {
    const parsed = await mammoth.extractRawText({ buffer: bytes });
    warnings.push(...parsed.messages.map((message) => message.message));
    return { text: parsed.value, detectedType: "docx", warnings };
  }

  if ([".xlsx", ".xls"].includes(ext) || mime.includes("spreadsheet")) {
    const workbook = xlsx.read(bytes, { type: "buffer" });
    const text = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      return `# Sheet: ${sheetName}\n${xlsx.utils.sheet_to_csv(sheet)}`;
    }).join("\n\n");
    return {
      text,
      detectedType: "spreadsheet",
      pagesOrSheets: workbook.SheetNames.length,
      warnings,
    };
  }

  if (IMAGE_EXTENSIONS.has(ext) || mime.startsWith("image/")) {
    if (!config.OCR_IMAGES) {
      return {
        text: "",
        detectedType: "image",
        warnings: ["OCR disabled by OCR_IMAGES=false"],
      };
    }
    const result = await Tesseract.recognize(bytes, "eng");
    return {
      text: result.data.text,
      detectedType: "image",
      warnings,
    };
  }

  throw new Error(`Unsupported attachment type: ${event.filename} ${event.mimeType ?? ""}`);
}

export function extractHtml(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

export function extractCsv(csv: string): string {
  return csv
    .split(/\r?\n/)
    .slice(0, 200)
    .map((line) => line.split(/[,\t]/).map((cell) => cell.trim()).join(" | "))
    .join("\n");
}

