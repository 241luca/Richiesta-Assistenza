#!/bin/bash

# 🚀 Script di avvio completo per Richiesta Assistenza Backend
# Avvia Redis e il Backend con un solo comando

echo "========================================="
echo "🚀 AVVIO SISTEMA RICHIESTA ASSISTENZA"
echo "========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# FUNZIONE: Libera una porta
free_port() {
    local PORT=$1
    local SERVICE=$2
    
    echo -e "${YELLOW}🔍 Controllo porta $PORT ($SERVICE)...${NC}"
    
    # Trova il processo che usa la porta
    local PID=$(lsof -ti:$PORT)
    
    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}⚠️  Porta $PORT occupata dal processo $PID${NC}"
        echo -e "${YELLOW}🔄 Termino il processo...${NC}"
        kill -9 $PID 2>/dev/null
        sleep 1
        echo -e "${GREEN}✅ Porta $PORT liberata!${NC}"
    else
        echo -e "${GREEN}✅ Porta $PORT libera${NC}"
    fi
}

# 1. PULIZIA PORTE
echo -e "\n${BLUE}🧹 Pulizia porte...${NC}"
echo "========================================="

# Libera la porta del backend
free_port 3200 "Backend"

# Libera la porta di Redis
free_port 6379 "Redis"

echo "========================================="

# 2. Controlla se Redis è già in esecuzione
echo -e "\n${YELLOW}📦 Avvio Redis...${NC}"

# Killa eventuali processi Redis rimasti
pkill -f redis-server 2>/dev/null
sleep 1

# Avvia Redis
redis-server --daemonize yes
sleep 2

# Verifica che Redis sia partito
if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis avviato con successo!${NC}"
    REDIS_VERSION=$(redis-cli --version | awk '{print $2}')
    echo -e "${GREEN}📊 Redis versione: $REDIS_VERSION${NC}"
    echo -e "${GREEN}📍 Redis porta: 6379${NC}"
else
    echo -e "${RED}❌ Errore nell'avvio di Redis${NC}"
    exit 1
fi

# 3. Avvia il backend
echo -e "\n${YELLOW}🚀 Avvio Backend Node.js...${NC}"
echo "========================================="

# Vai nella directory del backend
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Avvia il backend
npm run dev

# Quando il backend viene fermato (Ctrl+C), chiedi se fermare anche Redis
echo -e "\n${YELLOW}Backend fermato.${NC}"
read -p "Vuoi fermare anche Redis? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}🛑 Fermo Redis...${NC}"
    redis-cli shutdown
    echo -e "${GREEN}✅ Redis fermato${NC}"
fi

echo -e "${GREEN}👋 Arrivederci!${NC}"
