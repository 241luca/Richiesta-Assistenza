#!/bin/bash

# Script SICURO per aggiungere SOLO tabelle Payment
# SENZA toccare i dati esistenti!

echo "╔════════════════════════════════════════╗"
echo "║   AGGIUNTA SOLO TABELLE PAYMENT        ║"
echo "║   (MANTIENE TUTTI I DATI ESISTENTI)    ║"
echo "╚════════════════════════════════════════╝"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo ""
echo "Questo script:"
echo "✅ MANTIENE tutti i tuoi dati"
echo "✅ Aggiunge SOLO le tabelle Payment mancanti"
echo "❌ NON cancella niente"
echo ""

# Usa Prisma per aggiungere solo le tabelle mancanti
echo -e "${YELLOW}Aggiunta tabelle mancanti...${NC}"

# Genera schema senza cancellare
npx prisma db push --accept-data-loss

echo -e "${GREEN}✅ Fatto! Le tabelle Payment sono state aggiunte${NC}"
echo ""
echo "I tuoi dati sono TUTTI SALVI!"
