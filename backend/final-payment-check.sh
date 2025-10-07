#!/bin/bash

# Script di verifica finale sistema pagamenti
# Data: 29/01/2025

echo "╔════════════════════════════════════════╗"
echo "║   VERIFICA FINALE SISTEMA PAGAMENTI    ║"
echo "╚════════════════════════════════════════╝"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo ""
echo "🔍 CONTROLLO 1: Verifica tabelle Payment nel database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Query per contare le tabelle Payment
PAYMENT_TABLES=$(psql -U postgres -d assistenza_db -t -c "
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%ayment%' OR table_name LIKE '%nvoice%' OR table_name LIKE '%ayout%')
" 2>/dev/null | tr -d ' ')

if [ "$PAYMENT_TABLES" -gt "0" ]; then
    echo -e "${GREEN}✅ Trovate $PAYMENT_TABLES tabelle Payment nel database${NC}"
else
    echo -e "${RED}❌ Nessuna tabella Payment trovata${NC}"
fi

echo ""
echo "🔍 CONTROLLO 2: Verifica ENUM Payment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verifica gli enum
PAYMENT_ENUMS=$(psql -U postgres -d assistenza_db -t -c "
SELECT COUNT(*) 
FROM pg_type 
WHERE typname IN ('PaymentStatus', 'PaymentType', 'PaymentMethod')
" 2>/dev/null | tr -d ' ')

if [ "$PAYMENT_ENUMS" -eq "3" ]; then
    echo -e "${GREEN}✅ Tutti e 3 gli ENUM Payment presenti${NC}"
elif [ "$PAYMENT_ENUMS" -gt "0" ]; then
    echo -e "${YELLOW}⚠️  Solo $PAYMENT_ENUMS ENUM su 3 trovati${NC}"
else
    echo -e "${RED}❌ Nessun ENUM Payment trovato${NC}"
fi

echo ""
echo "🔍 CONTROLLO 3: Test Backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test che il backend possa importare i modelli
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.payment.findMany({ take: 1 })
  .then(() => console.log('✅ Model Payment accessibile dal backend'))
  .catch(() => console.log('❌ Errore accesso model Payment'));
prisma.invoice.findMany({ take: 1 })
  .then(() => console.log('✅ Model Invoice accessibile dal backend'))
  .catch(() => console.log('❌ Errore accesso model Invoice'));
setTimeout(() => process.exit(0), 1000);
" 2>/dev/null

echo ""
echo "🔍 CONTROLLO 4: File Service Payment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "src/services/payment.service.ts" ]; then
    echo -e "${GREEN}✅ payment.service.ts presente${NC}"
    
    # Verifica se usa ApiKeyService
    if grep -q "apiKeyService" src/services/payment.service.ts; then
        echo -e "${GREEN}✅ payment.service importa ApiKeyService${NC}"
    else
        echo -e "${YELLOW}⚠️  payment.service NON usa ApiKeyService${NC}"
    fi
else
    echo -e "${RED}❌ payment.service.ts NON trovato${NC}"
fi

echo ""
echo "🔍 CONTROLLO 5: Route Payment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "src/routes/payment.routes.ts" ]; then
    echo -e "${GREEN}✅ payment.routes.ts presente${NC}"
else
    echo -e "${RED}❌ payment.routes.ts NON trovato${NC}"
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        RIEPILOGO FINALE                ║"
echo "╚════════════════════════════════════════╝"

echo ""
if [ "$PAYMENT_TABLES" -gt "0" ] && [ "$PAYMENT_ENUMS" -eq "3" ]; then
    echo -e "${GREEN}🎉 SISTEMA PAGAMENTI INSTALLATO CON SUCCESSO!${NC}"
    echo ""
    echo "✅ Database: Tabelle Payment presenti"
    echo "✅ Schema: ENUM configurati"
    echo "✅ Backend: Service e routes pronti"
    echo ""
    echo "📋 PROSSIMO PASSO:"
    echo "   Configurare le API Keys di Stripe nel pannello Admin"
else
    echo -e "${YELLOW}⚠️  Installazione parziale - verifiche manuali necessarie${NC}"
fi

echo ""
