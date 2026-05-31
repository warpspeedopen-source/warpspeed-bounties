"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmSummarizer = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const logger_1 = require("../utils/logger");
class LlmSummarizer {
    ollamaHost;
    ollamaModel;
    maxCharLimit = 12000; // Limit content sent to LLM to prevent context overflow
    constructor() {
        this.ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
        // Remove trailing slash if present
        if (this.ollamaHost.endsWith('/')) {
            this.ollamaHost = this.ollamaHost.slice(0, -1);
        }
        this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3';
        logger_1.logger.info('Initializing LlmSummarizer', {
            ollamaHost: this.ollamaHost,
            ollamaModel: this.ollamaModel
        });
    }
    /**
     * Extracts text from the local attachment file based on file extension.
     * @param localFilePath Path to the local file
     * @returns Extracted string content
     */
    async extractText(localFilePath) {
        const ext = path.extname(localFilePath).toLowerCase();
        if (!fs.existsSync(localFilePath)) {
            throw new Error(`File not found for text extraction: ${localFilePath}`);
        }
        logger_1.logger.debug('Extracting text from file', { localFilePath, extension: ext });
        try {
            if (ext === '.pdf') {
                const dataBuffer = fs.readFileSync(localFilePath);
                const pdfData = await (0, pdf_parse_1.default)(dataBuffer);
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
                logger_1.logger.warn(`Unknown file extension ${ext}. Attempting text reading as fallback.`, { localFilePath });
                return fs.readFileSync(localFilePath, 'utf-8');
            }
            throw new Error(`Unsupported file type for text extraction: ${ext}`);
        }
        catch (error) {
            logger_1.logger.error(`Error extracting text from ${localFilePath}`, error);
            throw error;
        }
    }
    /**
     * Calls the local Ollama API to generate a natural language summary of the attachment.
     * @param localFilePath Path to the downloaded attachment
     * @returns Natural language summary
     */
    async summarize(localFilePath) {
        logger_1.logger.info(`Starting summarization for file: ${localFilePath}`);
        try {
            // 1. Extract file text content
            let extractedText = await this.extractText(localFilePath);
            extractedText = extractedText.trim();
            if (!extractedText) {
                throw new Error('Extracted text content is empty. Cannot summarize.');
            }
            // Truncate if it exceeds max context characters
            if (extractedText.length > this.maxCharLimit) {
                logger_1.logger.warn(`Extracted text is too long (${extractedText.length} chars). Truncating to ${this.maxCharLimit} chars.`);
                extractedText = extractedText.slice(0, this.maxCharLimit) + '\n[...Content truncated due to length limits...]';
            }
            // 2. Build the Ollama prompt
            const prompt = `You are a professional document summarizer. Summarize the following document. Provide a concise, clear high-level natural language summary of its contents, highlighting key entities, topics, and actions.
      
--- DOCUMENT CONTENT ---
${extractedText}
--- END DOCUMENT CONTENT ---

Please output only the concise natural language summary and nothing else. No preamble, no greetings, no introductory phrases.`;
            // 3. Make HTTP request to local Ollama API
            logger_1.logger.debug('Sending request to local Ollama API', { model: this.ollamaModel, endpoint: `${this.ollamaHost}/api/generate` });
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
            const responseBody = await response.json();
            const durationMs = Date.now() - startTime;
            if (!responseBody || !responseBody.response) {
                throw new Error('Invalid response format received from Ollama API.');
            }
            const summary = responseBody.response.trim();
            logger_1.logger.info('Successfully generated summary', {
                localFilePath,
                durationMs,
                summaryLength: summary.length
            });
            return summary;
        }
        catch (error) {
            logger_1.logger.error('Failed to summarize document', error, { localFilePath });
            throw error;
        }
    }
}
exports.LlmSummarizer = LlmSummarizer;
