import { config } from "../config.js";
import { AttachmentSummary } from "../types.js";

type OllamaResponse = {
  response?: string;
};

export class OllamaClient {
  async summarize(text: string): Promise<AttachmentSummary> {
    const prompt = buildSummaryPrompt(text);
    const response = await fetch(`${config.OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 350,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama failed: ${response.status} ${await response.text()}`);
    }

    const payload = (await response.json()) as OllamaResponse;
    return {
      summary: (payload.response ?? "").trim(),
      model: config.OLLAMA_MODEL,
      promptTokensEstimate: Math.ceil(prompt.length / 4),
    };
  }
}

export function buildSummaryPrompt(text: string): string {
  const clipped = text.replace(/\s+/g, " ").trim().slice(0, 18000);
  return [
    "You summarize email attachments for an operations inbox.",
    "Return a short factual summary. Do not invent facts.",
    "Include important dates, dollar amounts, people, organizations, action items, and risks if present.",
    "If the attachment is empty or unreadable, say so plainly.",
    "",
    "Attachment text:",
    clipped || "[No extractable text]",
  ].join("\n");
}

