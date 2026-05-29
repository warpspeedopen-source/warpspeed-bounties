import axios from 'axios';
import { config } from './config';

export async function summarizeText(text: string): Promise<string> {
  // Truncate text to avoid exceeding context window limits
  const truncatedText = text.substring(0, 15000); 
  
  const prompt = `Please provide a short, factual summary of the following document:\n\n${truncatedText}`;
  
  try {
    const response = await axios.post(`${config.ollamaApiUrl}/api/generate`, {
      model: config.ollamaModel,
      prompt: prompt,
      stream: false
    });
    
    return response.data.response;
  } catch (err) {
    console.error('Error summarizing text with LLM:', err);
    throw err;
  }
}
