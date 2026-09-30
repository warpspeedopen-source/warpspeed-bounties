import { GcsBlobStore, SqsQueue } from "./aws.ts"
import { processBatch } from "./pipeline.ts"
import { LocalLlmSummarizer } from "./summarize.ts"
import type { SummaryRecord, SummaryStore } from "./types.ts"

class MemorySummaryStore implements SummaryStore {
  rows = new Map<string, SummaryRecord>()
  async has(id: string): Promise<boolean> { return this.rows.has(id) }
  async save(row: SummaryRecord): Promise<void> { this.rows.set(row.id, row) }
}

async function main(): Promise<void> {
  const once = process.argv.includes("--once")
  const queue = new SqsQueue()
  const blobs = new GcsBlobStore()
  const summarizer = new LocalLlmSummarizer()
  const store: SummaryStore = new MemorySummaryStore()
  do {
    const result = await processBatch({ queue, blobs, summarizer, store })
    if (once) {
      console.log(JSON.stringify(result))
      return
    }
  } while (true)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
