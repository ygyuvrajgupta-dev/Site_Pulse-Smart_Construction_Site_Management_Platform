# ============================================================
# SitePulse — Backend API Dockerfile
# Multi-stage build: dependencies → Prisma generate → runtime
# ============================================================

# --- Stage 1: Install production dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app

# Copy lock file + manifest first for deterministic, cached installs
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund

# --- Stage 2: Generate the Prisma client ---
FROM node:20-alpine AS prisma
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma

RUN npx prisma generate

# --- Stage 3: Lean runtime image ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Run as a non-root user for security
RUN addgroup -S -g 1001 nodejs \
 && adduser -S -u 1001 -G nodejs -s /bin/sh -D nodejs

# Copy generated client, schema, and source from prior stages
COPY --from=prisma /app/node_modules ./node_modules
COPY --from=prisma /app/prisma ./prisma
COPY package.json ./
COPY src ./src

# Writable uploads volume (file storage feature)
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 5000

# Apply DB migrations on start, then launch the server.
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node src/server.js"]
