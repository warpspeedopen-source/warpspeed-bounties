import { inflateRawSync } from "node:zlib"

export class ExtractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ExtractError"
  }
}

const TEXT_MIMES = new Set([
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
])

export function extractText(mime: string, filename: string, bytes: Uint8Array): string {
  const kind = mime.split(";")[0].trim().toLowerCase()
  const name = filename.toLowerCase()
  if (TEXT_MIMES.has(kind) || name.endsWith(".txt") || name.endsWith(".csv") || name.endsWith(".md")) {
    return decodeUtf8(bytes).trim()
  }
  if (kind === "text/html" || name.endsWith(".html") || name.endsWith(".htm")) {
    return stripTags(decodeUtf8(bytes))
  }
  if (kind === "application/pdf" || name.endsWith(".pdf")) {
    return extractPdf(bytes)
  }
  if (kind === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.endsWith(".docx")) {
    return stripTags(readZipText(bytes, "word/document.xml"))
  }
  if (kind === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || name.endsWith(".xlsx")) {
    return stripTags(readZipText(bytes, "xl/sharedStrings.xml"))
  }
  if (kind.startsWith("image/")) {
    return `Image attachment ${filename} (${kind}, ${bytes.byteLength} bytes). No text layer.`
  }
  throw new ExtractError(`unsupported attachment type: ${kind || filename}`)
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes)
}

function stripTags(xml: string): string {
  return xml
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim()
}

function extractPdf(bytes: Uint8Array): string {
  const raw = decodeUtf8(bytes)
  const parts: string[] = []
  const re = /\((?:\\.|[^\\)]){2,}\)/g
  for (const match of raw.match(re) ?? []) {
    const inner = match.slice(1, -1).replace(/\\n/g, " ").replace(/\\(.)/g, "$1")
    if (/[A-Za-z]{3,}/.test(inner)) parts.push(inner)
  }
  const text = parts.join(" ").replace(/\s+/g, " ").trim()
  if (!text) throw new ExtractError("pdf contained no extractable text")
  return text
}

type ZipEntry = { name: string; method: number; compSize: number; dataStart: number }

function readZipText(bytes: Uint8Array, want: string): string {
  const entry = findZipEntry(bytes, want)
  if (!entry) throw new ExtractError(`zip entry missing: ${want}`)
  const slice = bytes.subarray(entry.dataStart, entry.dataStart + entry.compSize)
  if (entry.method === 0) return decodeUtf8(slice)
  if (entry.method === 8) return decodeUtf8(inflateRawSync(slice))
  throw new ExtractError(`unsupported zip method ${entry.method} for ${want}`)
}

function findZipEntry(bytes: Uint8Array, want: string): ZipEntry | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 0
  while (offset + 30 <= bytes.byteLength) {
    const sig = view.getUint32(offset, true)
    if (sig !== 0x04034b50) break
    const method = view.getUint16(offset + 8, true)
    const compSize = view.getUint32(offset + 18, true)
    const nameLen = view.getUint16(offset + 26, true)
    const extraLen = view.getUint16(offset + 28, true)
    const name = decodeUtf8(bytes.subarray(offset + 30, offset + 30 + nameLen))
    const dataStart = offset + 30 + nameLen + extraLen
    if (name === want) return { name, method, compSize, dataStart }
    offset = dataStart + compSize
  }
  return null
}
