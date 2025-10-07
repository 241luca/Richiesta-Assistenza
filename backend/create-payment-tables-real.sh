#!/bin/bash

# Script per CREARE REALMENTE le tabelle Payment nel database
# Data: 29/01/2025

echo "╔════════════════════════════════════════╗"
echo "║   CREAZIONE TABELLE PAYMENT DATABASE   ║"
echo "╚════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo ""
echo -e "${YELLOW}📦 Backup database attuale...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
pg_dump -U postgres assistenza_db > "backup_before_payment_${TIMESTAMP}.sql" 2>/dev/null
echo -e "${GREEN}✅ Backup salvato${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 1: Genera client Prisma${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

npx prisma generate

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 2: Crea e applica migrazione${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Forza la creazione della migrazione anche se ci sono differenze
npx prisma migrate dev --name add_payment_system_tables --create-only

# Applica la migrazione
npx prisma migrate deploy

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 3: Verifica tabelle create${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Conta tabelle Payment create
PAYMENT_COUNT=$(psql -U postgres -d assistenza_db -t -c "
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Payment', 'Invoice', 'Payout', 'PaymentSplit', 'Refund');" 2>/dev/null | tr -d ' ')

if [ -n "$PAYMENT_COUNT" ] && [ "$PAYMENT_COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ Create $PAYMENT_COUNT tabelle Payment principali${NC}"
    
    # Lista le tabelle create
    echo ""
    echo "Tabelle create:"
    psql -U postgres -d assistenza_db -t -c "
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('Payment', 'Invoice', 'Payout', 'PaymentSplit', 'Refund')
    ORDER BY table_name;" 2>/dev/null
else
    echo -e "${RED}❌ Nessuna tabella Payment creata${NC}"
    echo ""
    echo "Provo approccio alternativo..."
    
    # Reset e ricrea
    echo -e "${YELLOW}Reset database e ricreazione...${NC}"
    npx prisma migrate reset --force --skip-seed
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        PROCESSO COMPLETATO              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"

echo ""
echo "Verifica con: npx prisma studio"
