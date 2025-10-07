#!/bin/bash

# Script di verifica installazione Payment System
# Data: 29/01/2025

echo "╔════════════════════════════════════════╗"
echo "║   VERIFICA SISTEMA PAGAMENTI          ║"
echo "╚════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo ""
echo "🔍 VERIFICA 1: STRIPE in ApiKeyService"
if grep -q "STRIPE" prisma/schema.prisma; then
    echo -e "${GREEN}✅ STRIPE trovato in ApiKeyService${NC}"
else
    echo -e "${RED}❌ STRIPE NON trovato in ApiKeyService${NC}"
fi

echo ""
echo "🔍 VERIFICA 2: Enum PaymentStatus"
if grep -q "enum PaymentStatus" prisma/schema.prisma; then
    echo -e "${GREEN}✅ Enum PaymentStatus presente${NC}"
else
    echo -e "${RED}❌ Enum PaymentStatus MANCANTE${NC}"
fi

echo ""
echo "🔍 VERIFICA 3: Enum PaymentType"
if grep -q "enum PaymentType" prisma/schema.prisma; then
    echo -e "${GREEN}✅ Enum PaymentType presente${NC}"
else
    echo -e "${RED}❌ Enum PaymentType MANCANTE${NC}"
fi

echo ""
echo "🔍 VERIFICA 4: Enum PaymentMethod"
if grep -q "enum PaymentMethod" prisma/schema.prisma; then
    echo -e "${GREEN}✅ Enum PaymentMethod presente${NC}"
else
    echo -e "${RED}❌ Enum PaymentMethod MANCANTE${NC}"
fi

echo ""
echo "🔍 VERIFICA 5: Model Payment"
if grep -q "model Payment {" prisma/schema.prisma; then
    echo -e "${GREEN}✅ Model Payment presente${NC}"
else
    echo -e "${RED}❌ Model Payment MANCANTE${NC}"
fi

echo ""
echo "🔍 VERIFICA 6: Model Invoice"
if grep -q "model Invoice {" prisma/schema.prisma; then
    echo -e "${GREEN}✅ Model Invoice presente${NC}"
else
    echo -e "${RED}❌ Model Invoice MANCANTE${NC}"
fi

echo ""
echo "🔍 VERIFICA 7: Model Payout"
if grep -q "model Payout {" prisma/schema.prisma; then
    echo -e "${GREEN}✅ Model Payout presente${NC}"
else
    echo -e "${RED}❌ Model Payout MANCANTE${NC}"
fi

echo ""
echo "🔍 VERIFICA 8: Model PaymentSplit"
if grep -q "model PaymentSplit {" prisma/schema.prisma; then
    echo -e "${GREEN}✅ Model PaymentSplit presente${NC}"
else
    echo -e "${RED}❌ Model PaymentSplit MANCANTE${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 CONTEGGI FINALI:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Conta i modelli Payment-related
PAYMENT_MODELS=$(grep -c "model.*Payment\|model.*Invoice\|model.*Payout\|model.*Refund" prisma/schema.prisma)
echo "Modelli Payment trovati: $PAYMENT_MODELS"

# Conta tutti i modelli
TOTAL_MODELS=$(grep -c "^model " prisma/schema.prisma)
echo "Totale modelli nel database: $TOTAL_MODELS"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test connessione database
echo "🔌 Test connessione database..."
npx prisma db pull --print 2>&1 | head -5

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        VERIFICA COMPLETATA             ║"
echo "╚════════════════════════════════════════╝"
