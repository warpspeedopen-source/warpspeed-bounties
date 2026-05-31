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
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const logger_1 = require("./utils/logger");
const storageDownloader_1 = require("./services/storageDownloader");
const llmSummarizer_1 = require("./services/llmSummarizer");
const queueListener_1 = require("./services/queueListener");
// Load environment variables from local .env config
dotenv.config();
logger_1.logger.info('Starting Attachment Summarizer Service...');
async function main() {
    try {
        // 1. Instantiate the GCS and Ollama clients, injecting them into the SQS processor
        const storageDownloader = new storageDownloader_1.StorageDownloader();
        const llmSummarizer = new llmSummarizer_1.LlmSummarizer();
        const queueListener = new queueListener_1.QueueListener(storageDownloader, llmSummarizer);
        // 2. Setup signal listeners for seamless Kubernetes or Docker graceful shutdowns
        const shutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}. Starting graceful shutdown sequence...`);
            await queueListener.stop();
            logger_1.logger.info('Service shutdown complete. Safe to exit.');
            process.exit(0);
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        // Catch all unhandled process failures to guarantee robust diagnostics
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled Promise Rejection', reason);
        });
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception', error, { fatal: true });
            process.exit(1);
        });
        // 3. Start SQS Event Consumption
        await queueListener.start();
    }
    catch (error) {
        logger_1.logger.error('Fatal failure during service startup sequence', error);
        process.exit(1);
    }
}
main();
