import { truncateText, buildSummaryPrompt } from '../src/summarizers/ollamaSummarizer';

describe('truncateText', () => {
  it('returns text unchanged if under max tokens', () => {
    const short = 'Hello world';
    expect(truncateText(short, 100)).toBe(short);
  });

  it('truncates text exceeding maxTokens', () => {
    const long = 'a'.repeat(1000);
    const result = truncateText(long, 10);
    expect(result.length).toBeLessThan(long.length);
    expect(result).toContain('[Content truncated due to length]');
  });

  it('handles empty string', () => {
    expect(truncateText('', 100)).toBe('');
  });
});

describe('buildSummaryPrompt', () => {
  it('includes the content in the prompt', () => {
    const prompt = buildSummaryPrompt('Test content', 100);
    expect(prompt).toContain('Test content');
    expect(prompt).toContain('CONTENT START');
    expect(prompt).toContain('CONTENT END');
    expect(prompt).toContain('Summary:');
  });

  it('includes the max word limit', () => {
    const prompt = buildSummaryPrompt('Content', 50);
    expect(prompt).toContain('50');
  });
});
