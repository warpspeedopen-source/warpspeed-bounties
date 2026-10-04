import { Ollama } from 'ollama';
import { config } from '../config';
import { logger } from '../utils/logger';

export class OllamaService {
  private client: Ollama;

  constructor() {
    this.client = new Ollama({ host: config.ollama.url });
  }

  async summarize(text: string): Promise<string> {
    try {
      const response = await this.client.generate({
        model: config.ollama.model,
        prompt: `Summarize the following text in a concise, factual manner:\n\n${text}`,
        options: {
          temperature: config.ollama.temperature,
          num_predict: config.ollama.maxTokens,
        },
      });

      return response.response.trim();
    } catch (error) {
      logger.error('Error generating summary with Ollama', { error });
      throw new Error('Failed to generate summary');
    }
  }
}