# Submission Notes

## Summary

Implemented a Node.js/TypeScript attachment summarizer worker that processes SQS
events, downloads attachments from GCS, extracts content, generates factual
summaries with Ollama, and stores processing state with Prisma.

## Scope Covered

- SQS consumer with long polling
- GCS download integration
- Text extraction for text, HTML, CSV/TSV, PDF, DOCX, XLS/XLSX, and images
- Ollama local LLM client
- Prisma schema and repository layer
- Docker/Docker Compose setup
- Error handling and structured logs
- Tests and static validation script

## Payment Preference

Preferred payout, if accepted by the maintainer:

- Solana: `J8hHY978whDthFVrRrR7ypgyQ4jH6zpqfzzwVbWuERuv`
- Ethereum: `0xaeD3eE0637Fc7C7e5F6a920A8e000706D1cc7e6C`

PayPal can be provided by the human owner if platform payout requires it.

