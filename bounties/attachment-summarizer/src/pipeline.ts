import { extractText } from "./extract.ts"
import type { BlobStore, LogFn, Queue, Summarizer, SummaryStore } from "./types.ts"

export type PipelineDeps = {
  queue: Queue
  blobs: BlobStore
  summarizer: Summarizer
  store: SummaryStore
  log?: LogFn
}

export type BatchResult = {
  saved: string[]
  skipped: string[]
  failed: Array<{ id: string; error: string }>
}

const logDefault: LogFn = (level, message, fields) => {
  const extra = fields ? " " + JSON.stringify(fields) : ""
  console.log(`${new Date().toISOString()} ${level} ${message}${extra}`)
}

export async function processBatch(deps: PipelineDeps, max = 5): Promise<BatchResult> {
  const log = deps.log ?? logDefault
  const result: BatchResult = { saved: [], skipped: [], failed: [] }
  const batch = await deps.queue.receive(max)
  for (const item of batch) {
    const { event, receipt } = item
    try {
      if (await deps.store.has(event.id)) {
        await deps.queue.delete(receipt)
        result.skipped.push(event.id)
        log("info", "duplicate skipped", { id: event.id })
        continue
      }
      const bytes = await deps.blobs.download(event.bucket, event.object)
      const text = extractText(event.mime, event.filename, bytes)
      const summary = await deps.summarizer.summarize({
        filename: event.filename,
        mime: event.mime,
        text,
      })
      await deps.store.save({
        id: event.id,
        filename: event.filename,
        mime: event.mime,
        bucket: event.bucket,
        object: event.object,
        summary,
        extractedChars: text.length,
      })
      await deps.queue.delete(receipt)
      result.saved.push(event.id)
      log("info", "summary saved", { id: event.id, chars: text.length })
    } catch (err) {
      const error = (err as Error).message
      result.failed.push({ id: event.id, error })
      log("error", "attachment failed; message left on queue", { id: event.id, error })
    }
  }
  return result
}
