#!/bin/bash

# ==========================================
# STOP LOCAL - SMARTDOCS
# Ferma stack Docker locale
# ==========================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}  STOP DOCKER LOCALE - SMARTDOCS${NC}"
echo -e "${GREEN}===========================================${NC}"

echo -e "\n${YELLOW}Fermando servizi...${NC}"
docker-compose down

echo -e "\n${GREEN}✅ Servizi fermati${NC}"
echo -e "\n${YELLOW}Per riavviare:${NC} ./start-local.sh\n"
