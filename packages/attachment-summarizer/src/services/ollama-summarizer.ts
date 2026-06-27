import logger from '../lib/logger';
import { SummaryResult } from '../types';

export interface OllamaSummarizerOptions {
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

/**
 * Generates natural-language summaries using a self-hosted Ollama LLM.
 */
export class OllamaSummarizer {
  private options: OllamaSummarizerOptions;

  constructor(options: OllamaSummarizerOptions) {
    this.options = options;
  }

  /**
   * Generate a summary for extracted text content.
   */
  async summarize(attachmentId: string, text: string, contentType: string): Promise<SummaryResult> {
    const startTime = Date.now();
    const truncatedText = text.substring(0, 15000); // Limit context window

    logger.info({ attachmentId, contentType, textLength: text.length }, 'Generating summary');

    const prompt = this.buildPrompt(truncatedText, contentType);

    try {
      const summary = await this.callOllama(prompt);

      const processingTimeMs = Date.now() - startTime;
      logger.info({ attachmentId, summaryLength: summary.length, processingTimeMs }, 'Summary generated');

      return {
        attachmentId,
        summary,
        model: this.options.model,
        processingTimeMs,
      };
    } catch (error) {
      logger.error({ err: error, attachmentId }, 'Ollama summarization failed');
      throw error;
    }
  }

  private buildPrompt(text: string, contentType: string): string {
    return [
      'You are a precise document summarizer. Generate a concise, factual summary of the following content.',
      '',
      `Content type: ${contentType}`,
      '',
      'Rules:',
      '- Keep summary under 200 words',
      '- Focus on key facts, figures, and main points',
      '- Be objective and factual',
      '- Do not add information not present in the content',
      '',
      'Content:',
      '---',
      text,
      '---',
      '',
      'Summary:',
    ].join('\n');
  }

  private async callOllama(prompt: string): Promise<string> {
    const response = await fetch(`${this.options.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.options.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 512,
        },
      }),
      signal: AbortSignal.timeout(this.options.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Ollama API returned ${response.status}: ${await response.text()}`);
    }

    const data = await response.json() as { response: string };
    return data.response?.trim() || 'No summary generated.';
  }
}

export default OllamaSummarizer;
