#!/bin/bash

echo "🚀 AGGIORNAMENTO COMPLETO SISTEMA RICHIESTA ASSISTENZA"
echo "======================================================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backup dei package.json
echo -e "${YELLOW}📦 Creazione backup dei package.json...${NC}"
cp package.json package.json.backup-$(date +%Y%m%d-%H%M%S)
cp backend/package.json backend/package.json.backup-$(date +%Y%m%d-%H%M%S)

# FRONTEND - Aggiornamento alle ultime versioni
echo -e "${GREEN}🎨 AGGIORNAMENTO FRONTEND${NC}"
echo "-------------------------"

# Aggiorna Vite alla ultima versione
npm install vite@latest @vitejs/plugin-react@latest --save-dev

# Aggiorna React e dipendenze core
npm install react@latest react-dom@latest
npm install @types/react@latest @types/react-dom@latest --save-dev

# Aggiorna React Query alla ultima versione
npm install @