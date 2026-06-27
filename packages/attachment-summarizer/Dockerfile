# Attachment Summarizer Service

FROM node:20-alpine

RUN apk add --no-cache tini

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm ci --only=production

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY src/ ./src/
RUN npm run build

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
