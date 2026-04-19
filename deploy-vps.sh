#!/bin/bash

# ==========================================
# DEPLOY SCRIPT - RICHIESTA ASSISTENZA
# Deploy automatico su VPS con backup
# ==========================================

set -e  # Exit on error

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}  DEPLOY RICHIESTA ASSISTENZA - VPS${NC}"
echo -e "${GREEN}===========================================${NC}"

# ==========================================
# 1. VERIFICA PREREQUISITI
# ==========================================
echo -e "\n${YELLOW}[1/8] Verifica prerequisiti...${NC}"

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

echo -e "${GREEN}✅ Prerequisiti OK${NC}"

# ==========================================
# 2. CREA DIRECTORY DATI
# ==========================================
echo -e "\n${YELLOW}[2/8] Creazione directory dati...${NC}"

sudo mkdir -p /data/richiesta-assistenza/{postgres,redis,uploads,logs,backups}
sudo chown -R $USER:$USER /data/richiesta-assistenza

echo -e "${GREEN}✅ Directory create${NC}"

# ==========================================
# 3. BACKUP (se esiste deployment precedente)
# ==========================================
echo -e "\n${YELLOW}[3/8] Backup dati esistenti...${NC}"

if [ -d "/data/richiesta-assistenza/postgres/pgdata" ]; then
    BACKUP_DIR="/data/richiesta-assistenza/backups/deploy-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    echo -e "${YELLOW}Creazione backup in: $BACKUP_DIR${NC}"
    
    # Stop container per backup consistente
    docker-compose -f docker-compose.prod.yml down || true
    
    # Backup database
    sudo tar -czf "$BACKUP_DIR/postgres.tar.gz" -C /data/richiesta-assistenza postgres
    sudo tar -czf "$BACKUP_DIR/uploads.tar.gz" -C /data/richiesta-assistenza uploads
    
    echo -e "${GREEN}✅ Backup completato${NC}"
else
    echo -e "${YELLOW}⚠️  Primo deploy, nessun backup necessario${NC}"
fi

# ==========================================
# 4. PULL IMMAGINI DOCKER
# ==========================================
echo -e "\n${YELLOW}[4/8] Download immagini Docker...${NC}"

docker-compose -f docker-compose.prod.yml pull

echo -e "${GREEN}✅ Immagini scaricate${NC}"

# ==========================================
# 5. STOP SERVIZI ESISTENTI
# ==========================================
echo -e "\n${YELLOW}[5/8] Stop servizi esistenti...${NC}"

docker-compose -f docker-compose.prod.yml down || true

echo -e "${GREEN}✅ Servizi fermati${NC}"

# ==========================================
# 6. AVVIO SERVIZI
# ==========================================
echo -e "\n${YELLOW}[6/8] Avvio servizi...${NC}"

docker-compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}✅ Servizi avviati${NC}"

# ==========================================
# 7. ATTESA HEALTHCHECK
# ==========================================
echo -e "\n${YELLOW}[7/8] Attesa avvio servizi...${NC}"

echo -e "Attesa database..."
timeout 60 bash -c 'until docker exec assistenza-database pg_isready -U assistenza_user > /dev/null 2>&1; do sleep 2; done'

echo -e "Attesa backend..."
timeout 60 bash -c 'until docker exec assistenza-backend wget -q --spider http://localhost:3200/api/health > /dev/null 2>&1; do sleep 2; done'

echo -e "Attesa frontend..."
timeout 60 bash -c 'until docker exec assistenza-frontend wget -q --spider http://localhost/ > /dev/null 2>&1; do sleep 2; done'

echo -e "${GREEN}✅ Servizi pronti${NC}"

# ==========================================
# 8. VERIFICA STATO
# ==========================================
echo -e "\n${YELLOW}[8/8] Verifica stato servizi...${NC}"

docker-compose -f docker-compose.prod.yml ps

# ==========================================
# RIEPILOGO
# ==========================================
echo -e "\n${GREEN}===========================================${NC}"
echo -e "${GREEN}  ✅ DEPLOY COMPLETATO!${NC}"
echo -e "${GREEN}===========================================${NC}"

echo -e "\n📊 ${YELLOW}Servizi disponibili:${NC}"
echo -e "   Frontend:  http://localhost        (HTTP)"
echo -e "   Frontend:  https://localhost       (HTTPS)"
echo -e "   Backend:   http://localhost:3200   (API)"
echo -e "   Database:  postgresql://localhost:5434"
echo -e "   Redis:     redis://localhost:6379"

echo -e "\n📝 ${YELLOW}Comandi utili:${NC}"
echo -e "   Logs:      docker-compose -f docker-compose.prod.yml logs -f"
echo -e "   Stop:      docker-compose -f docker-compose.prod.yml down"
echo -e "   Restart:   docker-compose -f docker-compose.prod.yml restart"
echo -e "   Status:    docker-compose -f docker-compose.prod.yml ps"

echo -e "\n💾 ${YELLOW}Backup salvato in:${NC}"
if [ -n "$BACKUP_DIR" ]; then
    echo -e "   $BACKUP_DIR"
else
    echo -e "   (Primo deploy, nessun backup)"
fi

echo -e "\n${GREEN}Deploy completato con successo! 🎉${NC}\n"
