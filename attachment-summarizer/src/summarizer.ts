import axios from 'axios';
import { logger } from './logger';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';

export async function summarizeText(text: string): Promise<string> {
  const prompt = `Summarize the following text in a concise and factual manner:\n\n${text.substring(0, 8000)}`;
  
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL,
      prompt: prompt,
      stream: false,
    });
    
    return response.data.response.trim();
  } catch (err) {
    logger.error('Error calling Ollama', { err });
    throw new Error('Failed to generate summary');
  }
}