#!/bin/bash

# Script per verificare valori hardcoded nel sistema WhatsApp
# Usage: ./check-whatsapp-hardcoded.sh

echo "🔍 Verifica valori hardcoded nel sistema WhatsApp..."
echo "=================================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Valori da cercare
TOKEN="68c575f3c2ff1"
INSTANCE_ID="68C67956807C8"

echo ""
echo "📋 Cercando token hardcoded: $TOKEN"
echo "-----------------------------------"

# Cerca il token nel backend
if grep -r "$TOKEN" backend/src --include="*.ts" --include="*.js" 2>/dev/null; then
    echo -e "${RED}❌ Trovato token hardcoded nel backend!${NC}"
    echo "Sostituire con: process.env.SENDAPP_TOKEN"
else
    echo -e "${GREEN}✅ Nessun token hardcoded nel backend${NC}"
fi

# Cerca il token nel frontend
if grep -r "$TOKEN" src --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null; then
    echo -e "${RED}❌ Trovato token hardcoded nel frontend!${NC}"
    echo "Il token non dovrebbe essere nel frontend"
else
    echo -e "${GREEN}✅ Nessun token hardcoded nel frontend${NC}"
fi

echo ""
echo "📋 Cercando Instance ID hardcoded: $INSTANCE_ID"
echo "------------------------------------------------"

# Cerca l'instance ID nel backend
if grep -r "$INSTANCE_ID" backend/src --include="*.ts" --include="*.js" 2>/dev/null | grep -v "// Default" | grep -v "// Fallback"; then
    echo -e "${YELLOW}⚠️  Instance ID trovato nel backend${NC}"
    echo "Verificare che sia usato solo come fallback"
else
    echo -e "${GREEN}✅ Instance ID non hardcoded nel backend${NC}"
fi

echo ""
echo "📋 Verificando file .env"
echo "------------------------"

# Verifica se .env esiste
if [ -f "backend/.env" ]; then
    # Verifica se le variabili sono configurate
    if grep -q "SENDAPP_TOKEN" backend/.env; then
        echo -e "${GREEN}✅ SENDAPP_TOKEN trovato in .env${NC}"
    else
        echo -e "${YELLOW}⚠️  SENDAPP_TOKEN non trovato in .env${NC}"
        echo "Aggiungere: SENDAPP_TOKEN=$TOKEN"
    fi
    
    if grep -q "SENDAPP_URL" backend/.env; then
        echo -e "${GREEN}✅ SENDAPP_URL trovato in .env${NC}"
    else
        echo -e "${YELLOW}⚠️  SENDAPP_URL non trovato in .env${NC}"
        echo "Aggiungere: SENDAPP_URL=https://app.sendapp.cloud/api"
    fi
else
    echo -e "${RED}❌ File backend/.env non trovato!${NC}"
fi

echo ""
echo "📋 Verificando utilizzo variabili ambiente"
echo "------------------------------------------"

# Verifica se process.env è usato per SENDAPP
if grep -r "process.env.SENDAPP" backend/src --include="*.ts" --include="*.js" 2>/dev/null; then
    echo -e "${GREEN}✅ Variabili ambiente SENDAPP utilizzate${NC}"
else
    echo -e "${YELLOW}⚠️  Variabili ambiente SENDAPP non utilizzate${NC}"
    echo "Considerare l'uso di process.env.SENDAPP_TOKEN e process.env.SENDAPP_URL"
fi

echo ""
echo "=================================================="
echo "📊 Riepilogo"
echo "=================================================="

# Conta problemi
PROBLEMS=0

if grep -r "$TOKEN" backend/src --include="*.ts" --include="*.js" 2>/dev/null | grep -v "process.env" | grep -v "|| '$TOKEN'" > /dev/null; then
    ((PROBLEMS++))
    echo -e "${RED}• Token hardcoded trovato${NC}"
fi

if [ ! -f "backend/.env" ] || ! grep -q "SENDAPP_TOKEN" backend/.env 2>/dev/null; then
    ((PROBLEMS++))
    echo -e "${YELLOW}• Configurazione .env mancante o incompleta${NC}"
fi

if [ $PROBLEMS -eq 0 ]; then
    echo -e "${GREEN}✅ Nessun problema critico trovato!${NC}"
else
    echo -e "${RED}❌ Trovati $PROBLEMS problemi da risolvere${NC}"
fi

echo ""
echo "💡 Suggerimenti:"
echo "1. Usare sempre variabili d'ambiente per token e URL"
echo "2. Mantenere valori di default solo come fallback"
echo "3. Non committare mai .env nel repository"
echo "4. Documentare tutte le variabili necessarie"

echo ""
echo "✅ Verifica completata"
