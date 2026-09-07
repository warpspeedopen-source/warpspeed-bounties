/**
 * Ollama-backed summarizer. Calls the local Ollama HTTP API's
 * /api/generate endpoint with a streaming-capable prompt.
 *
 * Prompt goals:
 *   - Concise factual summary
 *   - Preserve named entities, numbers, dates
 *   - Avoid editorializing or invented content
 */

import type { SummaryResult, Logger } from "./types.js";

const SYSTEM_PROMPT = [
  "You are a precise, factual summarizer.",
  "Summarize the provided document text in 3-5 sentences.",
  "Preserve all named entities, numbers, and dates.",
  "Do not invent facts. If the text is unintelligible, say so plainly.",
  "Output only the summary — no preamble, no headings.",
].join(" ");

export interface SummarizerOptions {
  baseUrl: string;
  model: string;
  maxChars: number;
  logger: Logger;
  /** Optional fetch override — primarily for tests. */
  fetchImpl?: typeof fetch;
}

export class Summarizer {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly maxChars: number;
  private readonly logger: Logger;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: SummarizerOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.model = opts.model;
    this.maxChars = opts.maxChars;
    this.logger = opts.logger;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  /**
   * Truncate the input text to the configured cap, preferring whole
   * sentence boundaries.
   */
  private truncate(text: string): string {
    if (text.length <= this.maxChars) return text;
    const slice = text.slice(0, this.maxChars);
    const lastDot = Math.max(
      slice.lastIndexOf(". "),
      slice.lastIndexOf("。"),
      slice.lastIndexOf("! "),
      slice.lastIndexOf("? "),
    );
    if (lastDot > this.maxChars * 0.6) {
      return slice.slice(0, lastDot + 1);
    }
    return slice;
  }

  /**
   * Run the summarizer synchronously — collects the full response
   * before returning.
   */
  async summarize(text: string): Promise<SummaryResult> {
    const body = this.truncate(text);
    this.logger.info("Ollama summarize call", {
      model: this.model,
      inputChars: body.length,
    });

    const res = await this.fetchImpl(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        system: SYSTEM_PROMPT,
        prompt: body,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.9,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Ollama request failed: ${res.status} ${res.statusText} ${detail}`.trim(),
      );
    }

    const data = (await res.json()) as {
      response?: string;
      model?: string;
      eval_count?: number;
      prompt_eval_count?: number;
    };

    return {
      summary: (data.response ?? "").trim(),
      tokensUsed:
        (data.eval_count ?? 0) + (data.prompt_eval_count ?? 0) || undefined,
      model: data.model ?? this.model,
    };
  }

  /**
   * Streaming variant — yields chunks as they arrive from Ollama.
   * Each yielded value is the JSON-decoded line returned by Ollama.
   */
  async *summarizeStream(
    text: string,
  ): AsyncGenerator<{ chunk: string; done: boolean }, void, void> {
    const body = this.truncate(text);
    const res = await this.fetchImpl(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        system: SYSTEM_PROMPT,
        prompt: body,
        stream: true,
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Ollama stream failed: ${res.status} ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed) as {
              response?: string;
              done?: boolean;
            };
            yield {
              chunk: parsed.response ?? "",
              done: Boolean(parsed.done),
            };
          } catch {
            // Ignore malformed lines; Ollama emits NDJSON.
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}