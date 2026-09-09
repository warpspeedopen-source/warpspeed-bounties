FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npx prisma generate
RUN npm run build

FROM ollama/ollama:latest

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

RUN ollama pull mistral

ENV DATABASE_URL="file:/data/dev.db"
VOLUME /data

CMD ["node", "dist/index.js"]
