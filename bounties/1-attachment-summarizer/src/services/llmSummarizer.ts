import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import { logger } from '../utils/logger';

export class LlmSummarizer {
  private ollamaHost: string;
  private ollamaModel: string;
  private maxCharLimit: number = 12000; // Limit content sent to LLM to prevent context overflow

  constructor() {
    this.ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    // Remove trailing slash if present
    if (this.ollamaHost.endsWith('/')) {
      this.ollamaHost = this.ollamaHost.slice(0, -1);
    }
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3';
    
    logger.info('Initializing LlmSummarizer', {
      ollamaHost: this.ollamaHost,
      ollamaModel: this.ollamaModel
    });
  }

  /**
   * Extracts text from the local attachment file based on file extension.
   * @param localFilePath Path to the local file
   * @returns Extracted string content
   */
  private async extractText(localFilePath: string): Promise<string> {
    const ext = path.extname(localFilePath).toLowerCase();
    
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File not found for text extraction: ${localFilePath}`);
    }

    logger.debug('Extracting text from file', { localFilePath, extension: ext });

    try {
      if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(localFilePath);
        const pdfData = await pdf(dataBuffer);
        
        const text = pdfData.text || '';
        if (text.trim().length === 0) {
          throw new Error('PDF file appears to be empty or contains scanned images without text.');
        }
        return text;
      }
      
      if (['.txt', '.md', '.json', '.csv', '.xml', '.html'].includes(ext)) {
        return fs.readFileSync(localFilePath, 'utf-8');
      }

      // Fallback: attempt to read small files as UTF-8 text, or throw if too large
      const stats = fs.statSync(localFilePath);
      if (stats.size < 1024 * 1024) { // Under 1MB
        logger.warn(`Unknown file extension ${ext}. Attempting text reading as fallback.`, { localFilePath });
        return fs.readFileSync(localFilePath, 'utf-8');
      }

      throw new Error(`Unsupported file type for text extraction: ${ext}`);
    } catch (error) {
      logger.error(`Error extracting text from ${localFilePath}`, error);
      throw error;
    }
  }

  /**
   * Calls the local Ollama API to generate a natural language summary of the attachment.
   * @param localFilePath Path to the downloaded attachment
   * @returns Natural language summary
   */
  public async summarize(localFilePath: string): Promise<string> {
    logger.info(`Starting summarization for file: ${localFilePath}`);
    
    try {
      // 1. Extract file text content
      let extractedText = await this.extractText(localFilePath);
      
      extractedText = extractedText.trim();
      if (!extractedText) {
        throw new Error('Extracted text content is empty. Cannot summarize.');
      }

      // Truncate if it exceeds max context characters
      if (extractedText.length > this.maxCharLimit) {
        logger.warn(`Extracted text is too long (${extractedText.length} chars). Truncating to ${this.maxCharLimit} chars.`);
        extractedText = extractedText.slice(0, this.maxCharLimit) + '\n[...Content truncated due to length limits...]';
      }

      // 2. Build the Ollama prompt
      const prompt = `You are a professional document summarizer. Summarize the following document. Provide a concise, clear high-level natural language summary of its contents, highlighting key entities, topics, and actions.
      
--- DOCUMENT CONTENT ---
${extractedText}
--- END DOCUMENT CONTENT ---

Please output only the concise natural language summary and nothing else. No preamble, no greetings, no introductory phrases.`;

      // 3. Make HTTP request to local Ollama API
      logger.debug('Sending request to local Ollama API', { model: this.ollamaModel, endpoint: `${this.ollamaHost}/api/generate` });

      const startTime = Date.now();
      const response = await fetch(`${this.ollamaHost}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.ollamaModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3 // Keep summary highly factual
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText || response.statusText}`);
      }

      const responseBody = await response.json() as { response: string };
      const durationMs = Date.now() - startTime;

      if (!responseBody || !responseBody.response) {
        throw new Error('Invalid response format received from Ollama API.');
      }

      const summary = responseBody.response.trim();
      logger.info('Successfully generated summary', {
        localFilePath,
        durationMs,
        summaryLength: summary.length
      });

      return summary;
    } catch (error) {
      logger.error('Failed to summarize document', error, { localFilePath });
      throw error;
    }
  }
}
