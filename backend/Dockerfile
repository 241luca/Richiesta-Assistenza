# ================================
# Dockerfile - Backend Express + TypeScript
# Progetto: Richiesta Assistenza
# ================================

FROM node:20-alpine

WORKDIR /app

# Installa dipendenze sistema per Prisma
RUN apk add --no-cache openssl libc6-compat

# Copia package files
COPY package*.json ./
COPY prisma ./prisma/

# Installa dipendenze
RUN npm ci --only=production

# Genera Prisma Client
RUN npx prisma generate

# Copia codice sorgente
COPY . .

# Build TypeScript
RUN npm run build

# Esponi porta
EXPOSE 3200

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3200/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Avvia applicazione
CMD ["npm", "run", "start:prod"]
