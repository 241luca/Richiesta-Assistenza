#!/bin/bash

# ==========================================
# START LOCAL - SMARTDOCS
# Avvio stack Docker per test locale
# ==========================================

set -e

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}  AVVIO DOCKER LOCALE - SMARTDOCS${NC}"
echo -e "${GREEN}===========================================${NC}"

# ==========================================
# 1. VERIFICA PREREQUISITI
# ==========================================
echo -e "\n${YELLOW}[1/5] Verifica prerequisiti...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  File .env non trovato, creo da .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  IMPORTANTE: Aggiungi OPENAI_API_KEY in .env!${NC}"
    echo -e "${YELLOW}Premi CTRL+C per uscire e configurare, oppure INVIO per continuare...${NC}"
    read
fi

# Verifica OPENAI_API_KEY
if grep -q "your-openai-api-key-here" .env 2>/dev/null; then
    echo -e "${RED}❌ OPENAI_API_KEY non configurata!${NC}"
    echo -e "${YELLOW}Modifica .env e inserisci la tua API key OpenAI.${NC}"
    echo -e "${YELLOW}Vuoi continuare comunque? (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ Prerequisiti OK${NC}"

# ==========================================
# 2. STOP CONTAINER ESISTENTI
# ==========================================
echo -e "\n${YELLOW}[2/5] Stop container esistenti...${NC}"

docker-compose down 2>/dev/null || true

echo -e "${GREEN}✅ Container fermati${NC}"

# ==========================================
# 3. BUILD IMMAGINI
# ==========================================
echo -e "\n${YELLOW}[3/5] Build immagini Docker...${NC}"

docker-compose build --no-cache

echo -e "${GREEN}✅ Build completato${NC}"

# ==========================================
# 4. AVVIO SERVIZI
# ==========================================
echo -e "\n${YELLOW}[4/5] Avvio servizi...${NC}"

docker-compose up -d

echo -e "${GREEN}✅ Servizi avviati${NC}"

# ==========================================
# 5. ATTESA HEALTHCHECK
# ==========================================
echo -e "\n${YELLOW}[5/5] Attesa avvio servizi...${NC}"

echo -e "Attesa database..."
timeout 60 bash -c 'until docker exec smartdocs-db pg_isready -U smartdocs > /dev/null 2>&1; do sleep 2; echo -n "."; done' && echo ""

echo -e "Attesa Redis..."
timeout 30 bash -c 'until docker exec smartdocs-redis redis-cli ping > /dev/null 2>&1; do sleep 2; echo -n "."; done' && echo ""

echo -e "Attesa MinIO..."
timeout 30 bash -c 'until docker exec smartdocs-storage curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; do sleep 2; echo -n "."; done' && echo ""

echo -e "Attesa Qdrant..."
timeout 30 bash -c 'until docker exec smartdocs-vector wget -q --spider http://localhost:6333/ > /dev/null 2>&1; do sleep 2; echo -n "."; done' && echo ""

echo -e "Attesa API..."
timeout 90 bash -c 'until docker exec smartdocs-api wget -q --spider http://localhost:3500/health > /dev/null 2>&1; do sleep 2; echo -n "."; done' && echo ""

echo -e "Attesa Admin UI..."
timeout 30 bash -c 'until docker exec smartdocs-admin wget -q --spider http://localhost:3501/ > /dev/null 2>&1; do sleep 2; echo -n "."; done' && echo ""

echo -e "Attesa Nginx..."
timeout 30 bash -c 'until docker exec smartdocs-nginx wget -q --spider http://localhost/ > /dev/null 2>&1; do sleep 2; echo -n "."; done' && echo ""

echo -e "${GREEN}✅ Tutti i servizi pronti${NC}"

# ==========================================
# RIEPILOGO
# ==========================================
echo -e "\n${GREEN}===========================================${NC}"
echo -e "${GREEN}  ✅ STACK LOCALE AVVIATO!${NC}"
echo -e "${GREEN}===========================================${NC}"

echo -e "\n📊 ${YELLOW}Servizi disponibili:${NC}"
echo -e "   🌐 Admin UI:   ${GREEN}http://localhost:8083${NC}"
echo -e "   🔌 API:        ${GREEN}http://localhost:8083/api${NC}"
echo -e "   💚 Health:     ${GREEN}http://localhost:8083/health${NC}"
echo -e "   🗄️  Database:   postgresql://localhost:5436/smartdocs"
echo -e "   🔴 Redis:      redis://localhost:6381"
echo -e "   📦 MinIO UI:   ${GREEN}http://localhost:9001${NC}"
echo -e "   🔍 Qdrant:     http://localhost:6333"

echo -e "\n📝 ${YELLOW}Comandi utili:${NC}"
echo -e "   Logs:         ${GREEN}docker-compose logs -f${NC}"
echo -e "   Logs API:     ${GREEN}docker-compose logs -f smartdocs-api${NC}"
echo -e "   Logs Worker:  ${GREEN}docker-compose logs -f smartdocs-worker${NC}"
echo -e "   Stop:         ${GREEN}docker-compose down${NC}"
echo -e "   Restart:      ${GREEN}docker-compose restart${NC}"
echo -e "   Status:       ${GREEN}docker-compose ps${NC}"

echo -e "\n🧪 ${YELLOW}Test rapido:${NC}"
echo -e "   ${GREEN}curl http://localhost:8083/health${NC}"

echo -e "\n⚠️  ${YELLOW}IMPORTANTE:${NC}"
echo -e "   1. Accedi a MinIO: ${GREEN}http://localhost:9001${NC}"
echo -e "      User: smartdocs / Pass: smartdocs_minio_password"
echo -e "   2. Verifica che il bucket 'documents' esista"
echo -e "   3. Controlla logs worker se elabori documenti"

echo -e "\n${GREEN}Pronto per lo sviluppo! 🚀${NC}\n"
