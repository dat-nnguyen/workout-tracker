# ==========================================
# Stage 1: Build & Dependencies
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for Prisma generate)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Prune devDependencies to keep image lean
RUN npm prune --production

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Create application user for security (non-root execution)
USER node

# Copy production artifacts from builder stage
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/prisma ./prisma
COPY --chown=node:node src ./src
COPY --chown=node:node docs ./docs

# Expose HTTP port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start production server
CMD ["node", "src/server.js"]
