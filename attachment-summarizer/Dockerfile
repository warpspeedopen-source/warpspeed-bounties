# Multi-stage Dockerfile for attachment-summarizer.
#
# Stage 1 — builder: installs dev deps, generates Prisma client,
#           compiles TypeScript.
# Stage 2 — runtime: copies compiled JS + Prisma client, installs
#           production deps only.

# ---------- Builder ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install OS deps needed for sharp / native modules.
RUN apk add --no-cache python3 make g++ libc6-compat

# Install deps (including dev) for the build.
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci || npm install

# Generate the Prisma client before compiling.
RUN npx prisma generate

# Copy source and build.
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Runtime ----------
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

# Minimal runtime deps for sharp.
RUN apk add --no-cache libc6-compat vips

# Install only production deps.
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --omit=dev || npm install --omit=dev

# Bring across compiled artifacts and the generated Prisma client.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

# Run database migrations on container start, then exec the entrypoint.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]