import axios from 'axios';
import { createChildLogger } from '../utils/logger';
import type { SummaryResult } from '../models/types';

const log = createChildLogger('summarizer');

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000', 10);

/** Generate a summary of the extracted text using a local LLM (Ollama) */
export async function generateSummary(
  text: string,
  options?: {
    maxWords?: number;
    model?: string;
  },
): Promise<SummaryResult> {
  const maxWords = options?.maxWords || 200;
  const model = options?.model || OLLAMA_MODEL;

  // Truncate input to avoid context window issues
  const truncatedText = truncateText(text, 8000);

  const prompt = buildSummaryPrompt(truncatedText, maxWords);

  log.info(`Generating summary with ${model} (input: ${truncatedText.length} chars)`);

  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model,
        prompt,
        stream: false,
        options: {
          num_predict: 512,
          temperature: 0.3,
          top_p: 0.9,
        },
      },
      { timeout: OLLAMA_TIMEOUT_MS },
    );

    const summaryText = response.data.response?.trim() || '';
    const tokensIn = response.data.prompt_eval_count;
    const tokensOut = response.data.eval_count;

    log.info(`Summary generated (${tokensOut || '?'} tokens out)`);

    return {
      summaryText,
      modelUsed: model,
      tokensIn,
      tokensOut,
    };
  } catch (err: any) {
    // Fallback: generate a simple extractive summary if Ollama is unavailable
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED') {
      log.warn(`Ollama unavailable (${err.message}), using extractive fallback`);
      return fallbackSummary(truncatedText, maxWords);
    }
    throw err;
  }
}

/** Check if Ollama is reachable */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5_000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}

/** Build a prompt for the LLM */
function buildSummaryPrompt(text: string, maxWords: number): string {
  return [
    'You are a precise document summarizer. Summarize the following content',
    `in at most ${maxWords} words. Focus on key facts, data points, and`,
    'actionable information. Use clear, concise language.',
    '',
    '--- CONTENT START ---',
    text,
    '--- CONTENT END ---',
    '',
    'Summary:',
  ].join('\n');
}

/** Fallback extractive summary when LLM is unavailable */
function fallbackSummary(text: string, maxWords: number): SummaryResult {
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
  const words = text.split(/\s+/).filter(Boolean);
  const wordLimit = Math.min(maxWords, words.length);

  // Take first N words as extractive summary
  const summaryText = words.slice(0, wordLimit).join(' ');

  return {
    summaryText: summaryText || '(No content to summarize)',
    modelUsed: 'extractive-fallback',
    tokensIn: words.length,
    tokensOut: wordLimit,
    confidence: 0.5,
  };
}

/** Truncate text to approximate token limit (rough: 4 chars ≈ 1 token) */
function truncateText(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[Content truncated due to length]';
}
