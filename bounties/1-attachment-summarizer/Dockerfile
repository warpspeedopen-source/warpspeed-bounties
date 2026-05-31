# ==============================================================================
# STAGE 1: Builder (Compiles TypeScript to JavaScript)
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and typescript configuration
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies) for compilation
RUN npm ci

# Copy source files
COPY src/ ./src/

# Compile TypeScript code to ES2022 JavaScript inside ./dist
RUN npm run build

# Prune devDependencies, leaving only required production packages
RUN npm prune --production

# ==============================================================================
# STAGE 2: Runner (Lightweight Production Container)
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set container environment variables
ENV NODE_ENV=production \
    LOG_LEVEL=INFO

# Copy configurations, compiled files, and pruned dependencies from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Create local temp directory for downloads and grant ownership to 'node' user
RUN mkdir -p /app/temp && chown -R node:node /app

# Switch to the standard unprivileged 'node' user for security compliance
USER node

# Start the Node.js queue listener service
CMD ["node", "dist/index.js"]
