import { Ollama } from 'ollama';
import { env } from './env';
import { logger } from './logger';

const ollama = new Ollama({ host: env.OLLAMA_URL });

export class LLMService {
  static async summarizeText(text: string): Promise<string> {
    logger.info(`Sending text to Ollama model ${env.OLLAMA_MODEL}`);
    const prompt = `Summarize the following document content into a short factual summary:\n\n${text}\n\nSummary:`;
    const response = await ollama.generate({
      model: env.OLLAMA_MODEL,
      prompt,
    });
    return response.response.trim();
  }

  static async summarizeImage(base64Image: string): Promise<string> {
    logger.info(`Sending image to Ollama model ${env.OLLAMA_MODEL}`);
    // If the image model is llava, it handles images.
    const response = await ollama.generate({
      model: env.OLLAMA_MODEL,
      prompt: 'Describe this image briefly.',
      images: [base64Image]
    });
    return response.response.trim();
  }
}
