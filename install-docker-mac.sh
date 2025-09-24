#!/bin/bash

# Script per installare Docker su Mac
# Data: 21 Settembre 2025

echo "🐳 INSTALLAZIONE DOCKER PER MAC"
echo "================================"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Verifica e installa Homebrew se necessario
echo -e "${BLUE}1️⃣ Verifica Homebrew...${NC}"
if ! command -v brew &> /dev/null; then
    echo -e "${YELLOW}Homebrew non trovato. Installazione...${NC}"
    echo "Ti verrà chiesta la password del Mac"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Aggiungi Homebrew al PATH per chip Apple Silicon
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo -e "${GREEN}✅ Homebrew già installato${NC}"
fi

# 2. Installa Docker con Homebrew
echo ""
echo -e "${BLUE}2️⃣ Installazione Docker...${NC}"
echo "Questo potrebbe richiedere alcuni minuti..."

# Installa Docker Desktop
brew install --cask docker

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker installato con successo!${NC}"
else
    echo -e "${RED}❌ Errore installazione Docker${NC}"
    exit 1
fi

# 3. Avvia Docker Desktop
echo ""
echo -e "${BLUE}3️⃣ Avvio Docker Desktop...${NC}"
open -a Docker

echo ""
echo -e "${YELLOW}⏳ Attendi che Docker si avvii completamente (icona nella barra in alto)${NC}"
echo "   L'icona della balena deve smettere di 'animarsi'"
echo ""

# Attendi che Docker sia pronto
echo "Attendo 30 secondi per l'avvio di Docker..."
sleep 30

# 4. Verifica installazione
echo ""
echo -e "${BLUE}4️⃣ Verifica Docker...${NC}"
docker --version
docker ps

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 DOCKER INSTALLATO E FUNZIONANTE!${NC}"
    echo ""
    echo "Ora puoi procedere con l'installazione di EvolutionAPI"
else
    echo ""
    echo -e "${YELLOW}⚠️ Docker è installato ma potrebbe non essere ancora pronto${NC}"
    echo "Aspetta che l'icona di Docker nella barra in alto sia stabile"
    echo "Poi riprova con: docker ps"
fi