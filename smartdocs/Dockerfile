# ================================
# MULTI-STAGE BUILD per ottimizzazione
# ================================

# Stage 1: Base
FROM node:20-alpine AS base

# Metadata
LABEL maintainer="mario.rossi@assistenza.it"
LABEL description="SmartDocs - AI-powered Document Management System"

# Installa dipendenze sistema necessarie
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev \
    libc6-compat

WORKDIR /app

# Copia package files
COPY package*.json ./
COPY tsconfig.json ./

# ================================
# Stage 2: Development
# ================================
FROM base AS development

ENV NODE_ENV=development

# Installa TUTTE le dipendenze (dev + prod)
RUN npm install

# Copia source code
COPY . .

# Esponi porta API
EXPOSE 3500

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3500/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Hot reload con nodemon in development
CMD ["npm", "run", "dev"]

# ================================
# Stage 3: Builder (per production)
# ================================
FROM base AS builder

ENV NODE_ENV=production

# Installa dipendenze (con devDependencies per build)
RUN npm ci

# Copia source
COPY . .

# Build TypeScript → JavaScript
RUN npm run build

# Rimuovi devDependencies
RUN npm prune --production

# ================================
# Stage 4: Production
# ================================
FROM node:20-alpine AS production

ENV NODE_ENV=production

# Installa solo runtime deps
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    librsvg \
    pixman

WORKDIR /app

# Copia solo necessario da builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Crea user non-root per sicurezza
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambia ownership
RUN chown -R nodejs:nodejs /app

# Crea directory con permessi
RUN mkdir -p /app/uploads /app/.cache && \
    chown -R nodejs:nodejs /app/uploads /app/.cache

# Switch a user non-root
USER nodejs

EXPOSE 3500

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3500/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start server
CMD ["node", "dist/index.js"]
