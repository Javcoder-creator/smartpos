# ==========================================
# SMARTPOS Backend - Multi-stage Production Dockerfile
# ==========================================

# 1. Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and config
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript in /dist
RUN npm run build

# 2. Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Create upload directory
RUN mkdir -p /app/uploads && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
