import { summarizeText } from '../llm';
import axios from 'axios';

jest.mock('axios');

describe('LLM Summarization', () => {
  it('should return a summary from the LLM', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: { response: 'This is a test summary.' }
    });

    const summary = await summarizeText('Test content');
    expect(summary).toBe('This is a test summary.');
    expect(axios.post).toHaveBeenCalled();
  });
});
