export type AttachmentEvent = {
  id: string
  bucket: string
  object: string
  mime: string
  filename: string
}

export type Queued = {
  receipt: string
  event: AttachmentEvent
}

export type Queue = {
  receive(max: number): Promise<Queued[]>
  delete(receipt: string): Promise<void>
}

export type BlobStore = {
  download(bucket: string, objectName: string): Promise<Uint8Array>
}

export type Summarizer = {
  summarize(input: { filename: string; mime: string; text: string }): Promise<string>
}

export type SummaryRecord = {
  id: string
  filename: string
  mime: string
  bucket: string
  object: string
  summary: string
  extractedChars: number
}

export type SummaryStore = {
  has(id: string): Promise<boolean>
  save(row: SummaryRecord): Promise<void>
}

export type LogFn = (level: "info" | "error", message: string, fields?: Record<string, unknown>) => void
