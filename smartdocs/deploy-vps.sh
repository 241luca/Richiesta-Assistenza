#!/bin/bash

# ==========================================
# DEPLOY SCRIPT - SMARTDOCS
# Deploy automatico su VPS con backup
# ==========================================

set -e  # Exit on error

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}  DEPLOY SMARTDOCS - VPS${NC}"
echo -e "${GREEN}===========================================${NC}"

# ==========================================
# 1. VERIFICA PREREQUISITI
# ==========================================
echo -e "\n${YELLOW}[1/9] Verifica prerequisiti...${NC}"

if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ File .env.production non trovato!${NC}"
    echo -e "${YELLOW}Copia .env.production.example e configuralo.${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker non installato!${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose non installato!${NC}"
    exit 1
fi

# Verifica OPENAI_API_KEY
source .env.production
if [[ "$OPENAI_API_KEY" == *"YOUR_OPENAI_API_KEY"* ]]; then
    echo -e "${RED}❌ OPENAI_API_KEY non configurata!${NC}"
    echo -e "${YELLOW}Modifica .env.production con la tua API key OpenAI.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisiti OK${NC}"

# ==========================================
# 2. CREA DIRECTORY DATI
# ==========================================
echo -e "\n${YELLOW}[2/9] Creazione directory dati...${NC}"

sudo mkdir -p /data/smartdocs/{postgres,redis,minio,qdrant,uploads,cache,backups}
sudo chown -R $USER:$USER /data/smartdocs

echo -e "${GREEN}✅ Directory create${NC}"

# ==========================================
# 3. BACKUP (se esiste deployment precedente)
# ==========================================
echo -e "\n${YELLOW}[3/9] Backup dati esistenti...${NC}"

if [ -d "/data/smartdocs/postgres" ] && [ "$(ls -A /data/smartdocs/postgres)" ]; then
    BACKUP_DIR="/data/smartdocs/backups/deploy-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    echo -e "${YELLOW}Creazione backup in: $BACKUP_DIR${NC}"
    
    # Stop container per backup consistente
    docker-compose -f docker-compose.production.yml down || true
    
    # Backup database e uploads
    sudo tar -czf "$BACKUP_DIR/postgres.tar.gz" -C /data/smartdocs postgres 2>/dev/null || true
    sudo tar -czf "$BACKUP_DIR/uploads.tar.gz" -C /data/smartdocs uploads 2>/dev/null || true
    sudo tar -czf "$BACKUP_DIR/qdrant.tar.gz" -C /data/smartdocs qdrant 2>/dev/null || true
    
    echo -e "${GREEN}✅ Backup completato${NC}"
else
    echo -e "${YELLOW}⚠️  Primo deploy, nessun backup necessario${NC}"
fi

# ==========================================
# 4. BUILD IMMAGINI
# ==========================================
echo -e "\n${YELLOW}[4/9] Build immagini Docker...${NC}"

docker-compose -f docker-compose.production.yml build --no-cache

echo -e "${GREEN}✅ Immagini compilate${NC}"

# ==========================================
# 5. PULL IMMAGINI BASE
# ==========================================
echo -e "\n${YELLOW}[5/9] Download immagini base...${NC}"

docker-compose -f docker-compose.production.yml pull smartdocs-db smartdocs-redis smartdocs-storage smartdocs-vector smartdocs-nginx

echo -e "${GREEN}✅ Immagini scaricate${NC}"

# ==========================================
# 6. STOP SERVIZI ESISTENTI
# ==========================================
echo -e "\n${YELLOW}[6/9] Stop servizi esistenti...${NC}"

docker-compose -f docker-compose.production.yml down || true

echo -e "${GREEN}✅ Servizi fermati${NC}"

# ==========================================
# 7. AVVIO SERVIZI
# ==========================================
echo -e "\n${YELLOW}[7/9] Avvio servizi...${NC}"

docker-compose -f docker-compose.production.yml up -d

echo -e "${GREEN}✅ Servizi avviati${NC}"

# ==========================================
# 8. ATTESA HEALTHCHECK
# ==========================================
echo -e "\n${YELLOW}[8/9] Attesa avvio servizi...${NC}"

echo -e "Attesa database..."
timeout 60 bash -c 'until docker exec smartdocs-db pg_isready -U smartdocs > /dev/null 2>&1; do sleep 2; done'

echo -e "Attesa Redis..."
timeout 30 bash -c 'until docker exec smartdocs-redis redis-cli --no-auth-warning -a ${SMARTDOCS_REDIS_PASSWORD} ping > /dev/null 2>&1; do sleep 2; done'

echo -e "Attesa MinIO..."
timeout 30 bash -c 'until docker exec smartdocs-storage curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do sleep 2; done'

echo -e "Attesa Qdrant..."
timeout 30 bash -c 'until docker exec smartdocs-vector wget -q --spider http://localhost:6333/ > /dev/null 2>&1; do sleep 2; done'

echo -e "Attesa API..."
timeout 60 bash -c 'until docker exec smartdocs-api wget -q --spider http://localhost:3500/health > /dev/null 2>&1; do sleep 2; done'

echo -e "Attesa Nginx..."
timeout 30 bash -c 'until docker exec smartdocs-nginx wget -q --spider http://localhost/ > /dev/null 2>&1; do sleep 2; done'

echo -e "${GREEN}✅ Servizi pronti${NC}"

# ==========================================
# 9. VERIFICA STATO
# ==========================================
echo -e "\n${YELLOW}[9/9] Verifica stato servizi...${NC}"

docker-compose -f docker-compose.production.yml ps

# ==========================================
# RIEPILOGO
# ==========================================
echo -e "\n${GREEN}===========================================${NC}"
echo -e "${GREEN}  ✅ DEPLOY COMPLETATO!${NC}"
echo -e "${GREEN}===========================================${NC}"

echo -e "\n📊 ${YELLOW}Servizi disponibili:${NC}"
echo -e "   Admin UI:  http://localhost:8083"
echo -e "   API:       http://localhost:8083/api"
echo -e "   Health:    http://localhost:8083/health"
echo -e "   Database:  postgresql://localhost:5436"
echo -e "   Redis:     redis://localhost:6381"
echo -e "   MinIO UI:  http://localhost:9001"
echo -e "   Qdrant:    http://localhost:6333"

echo -e "\n📝 ${YELLOW}Comandi utili:${NC}"
echo -e "   Logs API:     docker-compose -f docker-compose.production.yml logs -f smartdocs-api"
echo -e "   Logs Worker:  docker-compose -f docker-compose.production.yml logs -f smartdocs-worker"
echo -e "   Logs Tutti:   docker-compose -f docker-compose.production.yml logs -f"
echo -e "   Stop:         docker-compose -f docker-compose.production.yml down"
echo -e "   Restart:      docker-compose -f docker-compose.production.yml restart"
echo -e "   Status:       docker-compose -f docker-compose.production.yml ps"

echo -e "\n💾 ${YELLOW}Backup salvato in:${NC}"
if [ -n "$BACKUP_DIR" ]; then
    echo -e "   $BACKUP_DIR"
else
    echo -e "   (Primo deploy, nessun backup)"
fi

echo -e "\n⚠️  ${YELLOW}IMPORTANTE:${NC}"
echo -e "   1. Accedi a MinIO Console: http://localhost:9001"
echo -e "      User: ${MINIO_ACCESS_KEY}"
echo -e "      Pass: (vedi .env.production)"
echo -e "   2. Crea bucket 'documents' se non esiste"
echo -e "   3. Verifica API: curl http://localhost:8083/health"

echo -e "\n${GREEN}Deploy completato con successo! 🎉${NC}\n"
