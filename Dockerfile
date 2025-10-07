# ================================
# Dockerfile - Frontend React + Vite
# Progetto: Richiesta Assistenza
# ================================

# STAGE 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci --only=production

# Copia codice sorgente
COPY . .

# Build produzione
RUN npm run build

# STAGE 2: Production
FROM nginx:alpine

# Copia build da stage precedente
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configurazione nginx custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Esponi porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Avvia nginx
CMD ["nginx", "-g", "daemon off;"]
