#!/bin/bash

# ==========================================
# START LOCAL - RICHIESTA ASSISTENZA
# Avvio stack Docker per test locale
# ==========================================

set -e

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}  AVVIO DOCKER LOCALE - RICHIESTA ASSISTENZA${NC}"
echo -e "${GREEN}===========================================${NC}"

# ==========================================
# 1. VERIFICA PREREQUISITI
# ==========================================
echo -e "\n${YELLOW}[1/5] Verifica prerequisiti...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  File .env non trovato, creo da .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}⚠️  IMPORTANTE: Configura .env prima di procedere!${NC}"
    echo -e "${YELLOW}Premi CTRL+C per uscire e configurare, oppure INVIO per continuare...${NC}"
    read
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
timeout 60 bash -c 'until docker exec assistenza-database pg_isready -U assistenza_user -d assistenza_db > /dev/null 2>&1; do sleep 2; echo -n "."; done' && echo ""

echo -e "Attesa Redis..."
timeout 30 bash -c 'until docker exec assistenza-redis redis-cli -a ${REDIS_PASSWORD:-redis_secure_password} ping > /dev/null 2>&1; do sleep 2; echo -n "."; done' && echo ""

echo -e "Attesa backend..."
timeout 60 bash -c 'until docker exec assistenza-backend wget -q --spider http://localhost:3200/api/health > /dev/null 2>&1; do sleep 2; echo -n "."; done' && echo ""

echo -e "Attesa frontend..."
timeout 30 bash -c 'until docker exec assistenza-frontend wget -q --spider http://localhost/ > /dev/null 2>&1; do sleep 2; echo -n "."; done' && echo ""

echo -e "${GREEN}✅ Tutti i servizi pronti${NC}"

# ==========================================
# RIEPILOGO
# ==========================================
echo -e "\n${GREEN}===========================================${NC}"
echo -e "${GREEN}  ✅ STACK LOCALE AVVIATO!${NC}"
echo -e "${GREEN}===========================================${NC}"

echo -e "\n📊 ${YELLOW}Servizi disponibili:${NC}"
echo -e "   🌐 Frontend:  ${GREEN}http://localhost:8084${NC}"
echo -e "   🔌 API:       ${GREEN}http://localhost:8084/api${NC}"
echo -e "   💚 Health:    ${GREEN}http://localhost:8084/api/health${NC}"
echo -e "   🗄️  Database:  postgresql://assistenza_user@localhost:5434/assistenza_db"
echo -e "   🔴 Redis:     redis://:password@localhost:6382"

echo -e "\n📝 ${YELLOW}Comandi utili:${NC}"
echo -e "   Logs:         ${GREEN}docker-compose logs -f${NC}"
echo -e "   Logs Backend: ${GREEN}docker-compose logs -f backend${NC}"
echo -e "   Stop:         ${GREEN}docker-compose down${NC}"
echo -e "   Restart:      ${GREEN}docker-compose restart${NC}"
echo -e "   Status:       ${GREEN}docker-compose ps${NC}"

echo -e "\n🧪 ${YELLOW}Test rapido:${NC}"
echo -e "   ${GREEN}curl http://localhost:8084/api/health${NC}"

echo -e "\n💾 ${YELLOW}Connessione database:${NC}"
echo -e "   ${GREEN}PGPASSWORD=assistenza_secure_password psql -h localhost -p 5434 -U assistenza_user -d assistenza_db${NC}"

echo -e "\n${GREEN}Pronto per lo sviluppo! 🚀${NC}\n"
