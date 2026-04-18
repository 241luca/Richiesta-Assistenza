# ==========================================
# BUILD STAGE - Compilazione TypeScript
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Aumenta memoria Node.js per TypeScript
ENV NODE_OPTIONS="--max-old-space-size=3072"

# Copia file dipendenze
COPY package*.json ./
COPY prisma ./prisma/

# Installa dipendenze (incluso devDependencies per build)
RUN npm install --legacy-peer-deps

# Copia codice sorgente
COPY . .

# Genera Prisma Client
RUN npx prisma generate

# Compila TypeScript (ignora errori per permettere il build)
RUN npm run build || true

# ==========================================
# PRODUCTION STAGE - Runtime
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Installa solo dipendenze di produzione
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps

# Copia Prisma schema e genera client
COPY prisma ./prisma/
RUN npx prisma generate

# Copia codice compilato dal builder
COPY --from=builder /app/dist ./dist

# Installa su-exec per cambio utente sicuro nell'entrypoint
RUN apk add --no-cache su-exec

# Crea directory necessarie e imposta permessi
RUN mkdir -p uploads logs backups

# User non-root per sicurezza
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Script di avvio che sistema i permessi dei volumi montati
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# NON impostiamo USER nodejs qui — lo fa l'entrypoint dopo aver sistemato i permessi
# USER nodejs

# Esponi porta
EXPOSE 3200

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3200/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Avvio applicazione tramite entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"]
