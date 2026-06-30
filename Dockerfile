# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++ libreoffice

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install runtime dependencies for file processing
RUN apk add --no-cache \
    libreoffice \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    ffmpeg \
    ca-certificates

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Create temp directory for downloads
RUN mkdir -p /app/temp-downloads && chown -R nodejs:nodejs /app/temp-downloads

USER nodejs

EXPOSE 300/fastify port

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]