import { ExtractionResult, Summary } from '../types';
import { randomUUID } from 'crypto';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const LLM_MODEL = process.env.LLM_MODEL ?? 'llama3.1:8b';
const MAX_INPUT_TOKENS = Number(process.env.MAX_INPUT_TOKENS) || 3072;
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS) || 512;

function truncateText(text: string, maxTokens: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxTokens) return text;
  return words.slice(0, maxTokens).join(' ') + '...';
}

function buildPrompt(extractedText: string, fileName: string): string {
  return [
    'You are an expert assistant that summarizes email attachments.',
    '',
    'Write a concise natural-language summary of the following document content.',
    'Include the key points, topics, and any actionable items.',
    'Use plain English, 3-5 sentences.',
    '',
    `File: ${fileName}`,
    '',
    '--- DOCUMENT CONTENT ---',
    extractedText,
    '',
    '--- SUMMARY ---',
  ].join('\n');
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function callOllama(
  prompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(
    `${OLLAMA_BASE_URL}/api/generate`,
    {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: MAX_OUTPUT_TOKENS,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Ollama API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    response: string;
    eval_count?: number;
  };
  return (data.response ?? '').trim();
}

export async function summarize(
  extraction: ExtractionResult,
): Promise<Summary> {
  const truncated = truncateText(extraction.text, MAX_INPUT_TOKENS);
  const promptTokens = estimateTokens(truncated);
  const prompt = buildPrompt(truncated, extraction.attachmentId);

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), 60_000);

  try {
    const summaryText = await callOllama(prompt, abortController.signal);
    const completionTokens = estimateTokens(summaryText);

    return {
      id: randomUUID(),
      attachmentId: extraction.attachmentId,
      summary: summaryText,
      model: LLM_MODEL,
      promptTokens,
      completionTokens,
      createdAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}
