import assert from "node:assert/strict"
import { deflateRawSync } from "node:zlib"
import test from "node:test"
import { extractText } from "../src/extract.ts"
import { processBatch } from "../src/pipeline.ts"
import { factualSummary } from "../src/summarize.ts"
import type { AttachmentEvent, BlobStore, Queue, Queued, Summarizer, SummaryRecord, SummaryStore } from "../src/types.ts"

class FakeQueue implements Queue {
  deleted: string[] = []
  items: Queued[]
  constructor(items: Queued[]) { this.items = items }
  async receive(max: number): Promise<Queued[]> { return this.items.slice(0, max) }
  async delete(receipt: string): Promise<void> { this.deleted.push(receipt) }
}

class FakeBlobs implements BlobStore {
  files: Record<string, Uint8Array>
  constructor(files: Record<string, Uint8Array>) { this.files = files }
  async download(bucket: string, objectName: string): Promise<Uint8Array> {
    const hit = this.files[`${bucket}/${objectName}`]
    if (!hit) throw new Error(`missing ${bucket}/${objectName}`)
    return hit
  }
}

class MemoryStore implements SummaryStore {
  rows = new Map<string, SummaryRecord>()
  async has(id: string): Promise<boolean> { return this.rows.has(id) }
  async save(row: SummaryRecord): Promise<void> { this.rows.set(row.id, row) }
}

const echo: Summarizer = {
  async summarize(input) { return factualSummary(input.text, 80) },
}

function event(over: Partial<AttachmentEvent> = {}): AttachmentEvent {
  return { id: "a1", bucket: "mail", object: "a1", mime: "text/plain", filename: "note.txt", ...over }
}

test("text attachment is summarized and the queue message is deleted", async () => {
  const queue = new FakeQueue([{ receipt: "r1", event: event() }])
  const store = new MemoryStore()
  const result = await processBatch({
    queue,
    blobs: new FakeBlobs({ "mail/a1": new TextEncoder().encode("Invoice 1042 is due Friday. Amount 40 USD.") }),
    summarizer: echo,
    store,
    log() {},
  })
  assert.deepEqual(result.saved, ["a1"])
  assert.deepEqual(queue.deleted, ["r1"])
  assert.match(store.rows.get("a1")!.summary, /Invoice 1042/)
})

test("html tags are stripped before summary", async () => {
  const queue = new FakeQueue([{
    receipt: "r2",
    event: event({ id: "a2", mime: "text/html", filename: "note.html", object: "a2" }),
  }])
  const store = new MemoryStore()
  await processBatch({
    queue,
    blobs: new FakeBlobs({ "mail/a2": new TextEncoder().encode("<p>Hello <b>team</b></p><script>secret()</script>") }),
    summarizer: echo,
    store,
    log() {},
  })
  const summary = store.rows.get("a2")!.summary
  assert.match(summary, /Hello team/)
  assert.doesNotMatch(summary, /secret|script/)
})

test("a duplicate id is deleted without a second summary", async () => {
  const store = new MemoryStore()
  await store.save({
    id: "a1", filename: "note.txt", mime: "text/plain", bucket: "mail", object: "a1",
    summary: "already", extractedChars: 7,
  })
  const queue = new FakeQueue([{ receipt: "r1", event: event() }])
  let calls = 0
  const result = await processBatch({
    queue,
    blobs: new FakeBlobs({ "mail/a1": new TextEncoder().encode("new") }),
    summarizer: { async summarize() { calls += 1; return "nope" } },
    store,
    log() {},
  })
  assert.deepEqual(result.skipped, ["a1"])
  assert.equal(calls, 0)
  assert.deepEqual(queue.deleted, ["r1"])
  assert.equal(store.rows.get("a1")!.summary, "already")
})

test("a summarizer failure leaves the message on the queue", async () => {
  const queue = new FakeQueue([{ receipt: "r1", event: event() }])
  const result = await processBatch({
    queue,
    blobs: new FakeBlobs({ "mail/a1": new TextEncoder().encode("hello") }),
    summarizer: { async summarize() { throw new Error("ollama down") } },
    store: new MemoryStore(),
    log() {},
  })
  assert.equal(result.failed[0].error, "ollama down")
  assert.deepEqual(queue.deleted, [])
})

test("pdf text objects are extracted", () => {
  const pdf = new TextEncoder().encode("BT (Invoice ready for review) Tj ET")
  assert.match(extractText("application/pdf", "a.pdf", pdf), /Invoice ready for review/)
})

test("stored docx word/document.xml is extracted", () => {
  const xml = "<w:t>Board minutes approved</w:t>"
  const docx = storedZip("word/document.xml", new TextEncoder().encode(xml))
  assert.match(
    extractText("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "m.docx", docx),
    /Board minutes approved/,
  )
})

test("deflated xlsx shared strings are extracted", () => {
  const xml = new TextEncoder().encode("<t>Q3 revenue</t>")
  const xlsx = deflatedZip("xl/sharedStrings.xml", xml)
  assert.match(
    extractText("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "q.xlsx", xlsx),
    /Q3 revenue/,
  )
})

test("images stay factual when there is no text layer", async () => {
  const queue = new FakeQueue([{
    receipt: "r",
    event: event({ id: "img", mime: "image/png", filename: "scan.png", object: "img" }),
  }])
  const store = new MemoryStore()
  await processBatch({
    queue,
    blobs: new FakeBlobs({ "mail/img": new Uint8Array([1, 2, 3, 4]) }),
    summarizer: echo,
    store,
    log() {},
  })
  assert.match(store.rows.get("img")!.summary, /Image attachment scan.png/)
  assert.deepEqual(queue.deleted, ["r"])
})

function storedZip(name: string, data: Uint8Array): Uint8Array {
  return zip(name, data, data, 0)
}

function deflatedZip(name: string, data: Uint8Array): Uint8Array {
  return zip(name, data, deflateRawSync(data), 8)
}

function zip(name: string, raw: Uint8Array, stored: Uint8Array, method: number): Uint8Array {
  const nameBytes = new TextEncoder().encode(name)
  const local = new Uint8Array(30 + nameBytes.length + stored.length)
  const view = new DataView(local.buffer)
  view.setUint32(0, 0x04034b50, true)
  view.setUint16(8, method, true)
  view.setUint32(18, stored.length, true)
  view.setUint32(22, raw.length, true)
  view.setUint16(26, nameBytes.length, true)
  local.set(nameBytes, 30)
  local.set(stored, 30 + nameBytes.length)
  return local
}
