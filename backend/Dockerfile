# ==========================================
# PRODUCTION STAGE - Solo runtime
# Il dist/ viene compilato sul Mac e copiato
# direttamente nel container (nessun build TS nel container)
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Installa su-exec per cambio utente sicuro nell'entrypoint
RUN apk add --no-cache su-exec

# Copia file dipendenze e installa solo produzione
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps

# Copia Prisma schema e genera client
COPY prisma ./prisma/
RUN npx prisma generate

# Copia il dist precompilato dal Mac
COPY dist ./dist

# Copia lo script di entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Crea directory necessarie
RUN mkdir -p uploads logs backups

# User non-root per sicurezza
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Esponi porta
EXPOSE 3200

# Healthcheck usa /health (senza autenticazione)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3200/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# L'entrypoint sistema i permessi dei volumi montati e poi avvia come nodejs
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
