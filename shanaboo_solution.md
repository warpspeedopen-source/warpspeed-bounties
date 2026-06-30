 ```diff
--- /dev/null
+++ b/services/attachment-summarizer/.env.example
@@ -0,0 +1,22 @@
+# AWS SQS Configuration
+AWS_REGION=us-east-1
+AWS_ACCESS_KEY_ID=your-access-key
+AWS_SECRET_ACCESS_KEY=your-secret-key
+SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/attachment-events
+SQS_VISIBILITY_TIMEOUT=300
+SQS_WAIT_TIME_SECONDS=20
+SQS_MAX_NUMBER_OF_MESSAGES=10
+
+# Google Cloud Storage Configuration
+GCS_PROJECT_ID=your-gcs-project-id
+GCS_BUCKET_NAME=your-attachment-bucket
+GCS_KEY_FILE_PATH=./gcs-service-account-key.json
+
+# Ollama / LLM Configuration
+OLLAMA_BASE_URL=http://localhost:11434
+OLLAMA_MODEL=llama3.2
+OLLAMA_SUMMARY_MAX_TOKENS=500
+
+# Application Configuration
+NODE_ENV=development
+LOG_LEVEL=info
+MAX_FILE_SIZE_MB=50
--- /dev/null
+++ b/services/attachment-summarizer/.gitignore
@@ -0,0 +1,5 @@
+node_modules/
+dist/
+.env
+*.log
+gcs-service-account-key.json
--- /dev/null
+++ b/services/attachment-summarizer/Dockerfile
@@ -0,0 +1,52 @@
+# Build stage
+FROM node:20-alpine AS builder
+
+WORKDIR /app
+
+# Install dependencies for building native modules
+RUN apk add --no-cache python3 make g++
+
+COPY package*.json ./
+COPY prisma ./prisma/
+
+RUN npm ci
+
+COPY . .
+
+RUN npm run build
+RUN npx prisma generate
+
+# Production stage
+FROM node:20-alpine AS production
+
+WORKDIR /app
+
+# Install runtime dependencies for file processing
+RUN apk add --no-cache \
+    python3 \
+    libreoffice \
+    poppler-utils \
+    tesseract-ocr \
+    tesseract-ocr-data-eng \
+    && ln -sf python3 /usr/bin/python
+
+# Create non-root user
+RUN addgroup -g 1001 -S nodejs && \
+    adduser -S nodejs -u 1001
+
+# Copy built application
+COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
+COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
+COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
+COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
+
+USER nodejs
+
+ENV NODE_ENV=production
+ENV PORT=3000
+
+EXPOSE 3000
+
+HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
+    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"
+
+CMD ["node", "dist/index.js"]
--- /dev/null
+++ b/services/attachment-summarizer/docker-compose.yml
@@ -0,0 +1,56 @@
+version: '3.8'
+
+services:
+  app:
+    build:
+      context: .
+      dockerfile: Dockerfile
+    container_name: attachment-summarizer
+    restart: unless-stopped
+    ports:
+      - "3000:3000"
+    environment:
+      - NODE_ENV=production
+      - AWS_REGION=${AWS_REGION}
+      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
+      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
+      - SQS_QUEUE_URL=${SQS_QUEUE_URL}
+      - GCS_PROJECT_ID=${GCS_PROJECT_ID}
+      - GCS_BUCKET_NAME=${GCS_BUCKET_NAME}
+      - OLLAMA_BASE_URL=http://ollama:11434
+      - OLLAMA_MODEL=${OLLAMA_MODEL}
+      - DATABASE_URL=postgresql://postgres:postgres@db:5432/attachment_summarizer
+    volumes:
+      - ./gcs-service-account-key.json:/app/gcs-service-account-key.json:ro
+    depends_on:
+      - db
+      - ollama
+    networks:
+      - attachment-summarizer-network
+
+  db:
+    image: postgres:15-alpine
+    container_name: attachment-summarizer-db
+    restart: unless-stopped
+    environment:
+      - POSTGRES_USER=postgres
+      - POSTGRES_PASSWORD=postgres
+      - POSTGRES_DB=attachment_summarizer
+    volumes:
+      - postgres_data:/var/lib/postgresql/data
+    networks:
+      - attachment-summarizer-network
+
+  ollama:
+    image: ollama/ollama:latest
+    container_name: attachment-summarizer-ollama
+    restart: unless-stopped
+    volumes:
+      - ollama_data:/root/.ollama
+    networks:
+      - attachment-summarizer-network
+    # Pre-pull the model on first run
+    entrypoint: ["/bin/sh", "-c", "ollama serve & sleep 10 && ollama pull ${OLLAMA_MODEL:-llama3.2} && wait"]
+
+volumes:
+  postgres_data:
+  ollama_data:
+
+networks:
+  attachment-summarizer-network:
+    driver: bridge
--- /dev/null
+++ b/services/attachment-summarizer/jest.config.js
@@ -0,0 +1,18 @@
+/** @type {import('ts-jest').JestConfigWithTsJest} */
+module.exports = {
+  preset: 'ts-jest',
+  testEnvironment: 'node',
+  roots: ['<rootDir>/src'],
+  testMatch: ['**/__tests__/**/*.test.ts'],
+  transform: {
+    '^.+\\.tsx?$': 'ts-jest',
+  },
+  moduleNameMapper: {
+    '^@/(.*)$': '<rootDir>/src/$1',
+  },
+  collectCoverageFrom: [
+    'src/**/*.ts',
+    '!src/**/*.d.ts',
+    '!src/**/__tests__/**',
+  ],
+  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
+};
--- /dev/null
+++ b/services/attachment-summarizer/package.json
@@ -0,0 +1,62 @@
+{
+  "name": "attachment-summarizer",
+ 