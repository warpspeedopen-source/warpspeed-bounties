import axios from 'axios';

interface GenerateResponse {
  response: string;
}

export const generateSummary = async (text: string): Promise<string> => {
  const response = await axios.post<GenerateResponse>(
    'http://localhost:11435/api/generate',
    {
      model: 'mistral',
      prompt: `Summarize this text concisely:\n\n${text}\n\nSummary:`,
      stream: false,
    },
    { timeout: 60000 }
  );
  return response.data.response.trim();
};
