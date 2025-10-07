#!/bin/bash

# Script per rimuovere duplicati dal sistema pagamenti
# Data: 29/01/2025

echo "╔════════════════════════════════════════╗"
echo "║   RIMOZIONE DUPLICATI PAYMENT SYSTEM   ║"
echo "╚════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo ""
echo -e "${YELLOW}📦 Creazione backup prima della pulizia...${NC}"
cp prisma/schema.prisma "prisma/schema.prisma.backup-before-dedup-$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Backup creato${NC}"

echo ""
echo -e "${YELLOW}🔍 Analisi duplicati...${NC}"

# Conta le occorrenze
PAYMENT_SETTINGS_COUNT=$(grep -c "model ProfessionalPaymentSettings" prisma/schema.prisma)
INVOICE_COUNT=$(grep -c "model Invoice {" prisma/schema.prisma)
PAYMENT_SPLIT_COUNT=$(grep -c "model PaymentSplit" prisma/schema.prisma)
PAYMENT_STATUS_COUNT=$(grep -c "enum PaymentStatus" prisma/schema.prisma)
PAYMENT_TYPE_COUNT=$(grep -c "enum PaymentType" prisma/schema.prisma)
PAYMENT_METHOD_COUNT=$(grep -c "enum PaymentMethod" prisma/schema.prisma)

echo "ProfessionalPaymentSettings: $PAYMENT_SETTINGS_COUNT occorrenze"
echo "Invoice: $INVOICE_COUNT occorrenze"
echo "PaymentSplit: $PAYMENT_SPLIT_COUNT occorrenze"
echo "PaymentStatus enum: $PAYMENT_STATUS_COUNT occorrenze"
echo "PaymentType enum: $PAYMENT_TYPE_COUNT occorrenze"
echo "PaymentMethod enum: $PAYMENT_METHOD_COUNT occorrenze"

echo ""
echo -e "${YELLOW}🔧 Creazione schema pulito...${NC}"

# Trova la prima riga dove iniziano i duplicati
# Dovrebbe essere dopo la riga 3338 secondo l'errore
DUPLICATE_START=3338

# Crea un file temporaneo con solo la parte prima dei duplicati
head -n $((DUPLICATE_START - 1)) prisma/schema.prisma > prisma/schema-clean.tmp

# Salva il file pulito
mv prisma/schema-clean.tmp prisma/schema.prisma

echo -e "${GREEN}✅ Duplicati rimossi${NC}"

echo ""
echo -e "${YELLOW}📝 Verifica schema pulito...${NC}"

# Verifica formato
npx prisma format

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema formattato correttamente${NC}"
else
    echo -e "${RED}❌ Errore nel formato dello schema${NC}"
    echo "Ripristino backup..."
    cp prisma/schema.prisma.backup-before-dedup-* prisma/schema.prisma
    exit 1
fi

echo ""
echo -e "${YELLOW}🔍 Verifica finale...${NC}"

# Conta di nuovo per verificare
PAYMENT_COUNT_AFTER=$(grep -c "model Payment {" prisma/schema.prisma)
INVOICE_COUNT_AFTER=$(grep -c "model Invoice {" prisma/schema.prisma)

echo "Modelli Payment dopo pulizia: $PAYMENT_COUNT_AFTER"
echo "Modelli Invoice dopo pulizia: $INVOICE_COUNT_AFTER"

if [ $PAYMENT_COUNT_AFTER -eq 1 ] && [ $INVOICE_COUNT_AFTER -eq 1 ]; then
    echo -e "${GREEN}✅ Schema correttamente pulito!${NC}"
else
    echo -e "${YELLOW}⚠️  Verifica manuale necessaria${NC}"
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        ✅ PULIZIA COMPLETATA           ║"
echo "╚════════════════════════════════════════╝"

echo ""
echo "Ora puoi eseguire:"
echo "  npx prisma generate"
echo "  npx prisma migrate dev --name fix-payment-duplicates"
