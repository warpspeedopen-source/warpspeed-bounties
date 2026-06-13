import axios from 'axios';
import { logger } from './logger';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';

export async function generateSummary(text: string): Promise<string> {
  const prompt = `Summarize the following content in a factual manner, highlighting key points. Keep the summary concise (max 3 sentences).\n\nContent:\n${text.substring(0, 3000)}`; // limit text to avoid token overflow
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL,
      prompt: prompt,
      stream: false,
    });
    const summary = response.data.response.trim();
    return summary;
  } catch (error) {
    logger.error(error, 'Ollama request failed');
    throw new Error('Failed to generate summary from LLM');
  }
}