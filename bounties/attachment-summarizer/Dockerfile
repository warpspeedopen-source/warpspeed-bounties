FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json ./
COPY prisma ./prisma
COPY src ./src
USER node
CMD ["node", "--experimental-strip-types", "src/index.ts"]
