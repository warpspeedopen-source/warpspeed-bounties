import type { Summarizer } from "./types.ts"

export class SummarizeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SummarizeError"
  }
}

export function factualSummary(text: string, limit = 480): string {
  const clean = text.replace(/\s+/g, " ").trim()
  if (!clean) return "No extractable text."
  if (clean.length <= limit) return clean
  return clean.slice(0, limit).trimEnd() + "…"
}

export class LocalLlmSummarizer implements Summarizer {
  endpoint: string
  model: string
  fetchImpl: typeof fetch

  constructor(
    endpoint = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434",
    model = process.env.OLLAMA_MODEL ?? "llama3.2",
    fetchImpl: typeof fetch = fetch,
  ) {
    this.endpoint = endpoint
    this.model = model
    this.fetchImpl = fetchImpl
  }

  async summarize(input: { filename: string; mime: string; text: string }): Promise<string> {
    const prompt = [
      "Write a short factual summary of this email attachment.",
      "Do not invent facts that are not in the text.",
      `File: ${input.filename} (${input.mime})`,
      "",
      input.text.slice(0, 12000),
    ].join("\n")
    let response: Response
    try {
      response = await this.fetchImpl(`${this.endpoint.replace(/\/$/, "")}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: this.model, prompt, stream: false }),
      })
    } catch (err) {
      throw new SummarizeError(`ollama unreachable: ${(err as Error).message}`)
    }
    if (!response.ok) throw new SummarizeError(`ollama HTTP ${response.status}`)
    const body = await response.json() as { response?: string }
    const text = (body.response ?? "").trim()
    if (!text) throw new SummarizeError("ollama returned an empty summary")
    return text
  }
}
