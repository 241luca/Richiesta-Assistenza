#!/bin/bash

# ==========================================
# DOCKER LOCAL - MANAGER
# Gestione completa stack locali
# ==========================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  DOCKER LOCAL MANAGER${NC}"
echo -e "${BLUE}===========================================${NC}"

# Funzione per mostrare status
show_status() {
    echo -e "\n${YELLOW}📊 STATO SERVIZI${NC}\n"
    
    echo -e "${GREEN}Richiesta Assistenza:${NC}"
    if docker ps | grep -q "assistenza-"; then
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "assistenza-"
    else
        echo -e "${RED}   ❌ Non attivo${NC}"
    fi
    
    echo -e "\n${GREEN}SmartDocs:${NC}"
    if docker ps | grep -q "smartdocs-"; then
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "smartdocs-"
    else
        echo -e "${RED}   ❌ Non attivo${NC}"
    fi
}

# Menu
echo -e "\n${YELLOW}Cosa vuoi fare?${NC}\n"
echo "  1) ▶️  Avvia Richiesta Assistenza"
echo "  2) ▶️  Avvia SmartDocs"
echo "  3) ▶️  Avvia TUTTO"
echo "  4) ⏸️  Ferma Richiesta Assistenza"
echo "  5) ⏸️  Ferma SmartDocs"
echo "  6) ⏹️  Ferma TUTTO"
echo "  7) 📊 Mostra stato"
echo "  8) 📝 Mostra logs Richiesta Assistenza"
echo "  9) 📝 Mostra logs SmartDocs"
echo "  0) ❌ Esci"

echo -e "\n${YELLOW}Scelta:${NC} "
read choice

case $choice in
    1)
        echo -e "\n${GREEN}▶️  Avvio Richiesta Assistenza...${NC}"
        ./start-local.sh
        ;;
    2)
        echo -e "\n${GREEN}▶️  Avvio SmartDocs...${NC}"
        cd smartdocs && ./start-local.sh
        ;;
    3)
        echo -e "\n${GREEN}▶️  Avvio TUTTO...${NC}"
        echo -e "\n${YELLOW}[1/2] Richiesta Assistenza${NC}"
        ./start-local.sh
        echo -e "\n${YELLOW}[2/2] SmartDocs${NC}"
        cd smartdocs && ./start-local.sh
        ;;
    4)
        echo -e "\n${YELLOW}⏸️  Stop Richiesta Assistenza...${NC}"
        ./stop-local.sh
        ;;
    5)
        echo -e "\n${YELLOW}⏸️  Stop SmartDocs...${NC}"
        cd smartdocs && ./stop-local.sh
        ;;
    6)
        echo -e "\n${RED}⏹️  Stop TUTTO...${NC}"
        ./stop-local.sh
        cd smartdocs && ./stop-local.sh
        echo -e "${GREEN}✅ Tutto fermato${NC}"
        ;;
    7)
        show_status
        ;;
    8)
        echo -e "\n${YELLOW}📝 Logs Richiesta Assistenza (CTRL+C per uscire)${NC}\n"
        docker-compose logs -f
        ;;
    9)
        echo -e "\n${YELLOW}📝 Logs SmartDocs (CTRL+C per uscire)${NC}\n"
        cd smartdocs && docker-compose logs -f
        ;;
    0)
        echo -e "\n${GREEN}Ciao! 👋${NC}\n"
        exit 0
        ;;
    *)
        echo -e "\n${RED}❌ Scelta non valida${NC}"
        exit 1
        ;;
esac
