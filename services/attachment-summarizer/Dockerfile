# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npm run prisma:generate

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dependencies for file processing
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libreoffice \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-data-eng

# Install Ollama
RUN wget -q -O /etc/apk/keys/ollama.alpine.dev.rsa.pub https://ollama.com/download/ollama.alpine.dev.rsa.pub && \
    echo "https://ollama.com/download/alpine" >> /etc/apk/repositories && \
    apk add --no-cache ollama

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npm run prisma:generate

COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]