#!/bin/bash

# Script SICURO per rimuovere SOLO i duplicati dal sistema pagamenti
# Data: 29/01/2025
# VERSIONE 2.0 - PIÙ SICURA

echo "╔════════════════════════════════════════╗"
echo "║   FIX DUPLICATI PAYMENT SYSTEM v2.0    ║"
echo "╚════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Backup SEMPRE
echo -e "${YELLOW}📦 Backup dello schema attuale...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="prisma/schema.prisma.backup-duplicates-${TIMESTAMP}"
cp prisma/schema.prisma "$BACKUP_FILE"
echo -e "${GREEN}✅ Backup salvato: $BACKUP_FILE${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}ANALISI DEI DUPLICATI${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Trova le righe dove appaiono i duplicati
echo "Cercando duplicati..."

# Trova la PRIMA occorrenza (quella buona da tenere)
FIRST_PAYMENT_SETTINGS=$(grep -n "model ProfessionalPaymentSettings" prisma/schema.prisma | head -1 | cut -d: -f1)
FIRST_INVOICE=$(grep -n "model Invoice {" prisma/schema.prisma | head -1 | cut -d: -f1)
FIRST_PAYMENT_STATUS=$(grep -n "enum PaymentStatus" prisma/schema.prisma | head -1 | cut -d: -f1)

# Trova la SECONDA occorrenza (il duplicato da rimuovere)
SECOND_PAYMENT_SETTINGS=$(grep -n "model ProfessionalPaymentSettings" prisma/schema.prisma | tail -1 | cut -d: -f1)
SECOND_INVOICE=$(grep -n "model Invoice {" prisma/schema.prisma | tail -1 | cut -d: -f1)
SECOND_PAYMENT_STATUS=$(grep -n "enum PaymentStatus" prisma/schema.prisma | tail -1 | cut -d: -f1)

echo ""
echo "📍 Prima occorrenza ProfessionalPaymentSettings: riga $FIRST_PAYMENT_SETTINGS"
echo "📍 Duplicato ProfessionalPaymentSettings: riga $SECOND_PAYMENT_SETTINGS"
echo ""
echo "📍 Prima occorrenza Invoice: riga $FIRST_INVOICE"
echo "📍 Duplicato Invoice: riga $SECOND_INVOICE"
echo ""
echo "📍 Prima occorrenza PaymentStatus: riga $FIRST_PAYMENT_STATUS"
echo "📍 Duplicato PaymentStatus: riga $SECOND_PAYMENT_STATUS"

# Verifica che ci siano effettivamente duplicati
if [ "$FIRST_PAYMENT_SETTINGS" == "$SECOND_PAYMENT_SETTINGS" ]; then
    echo -e "${GREEN}✅ Nessun duplicato trovato per ProfessionalPaymentSettings${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}RIMOZIONE SICURA DEI DUPLICATI${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Trova dove iniziano i duplicati (dovrebbe essere intorno alla riga 3338)
# Assumiamo che tutti i duplicati siano alla fine del file
DUPLICATE_START_LINE=$SECOND_PAYMENT_SETTINGS

# Se il secondo gruppo è dopo la riga 3000, probabilmente sono i duplicati alla fine
if [ $DUPLICATE_START_LINE -gt 3000 ]; then
    echo -e "${YELLOW}🔧 Rimozione duplicati dalla riga $DUPLICATE_START_LINE in poi...${NC}"
    
    # Tieni solo le righe PRIMA dei duplicati
    head -n $((DUPLICATE_START_LINE - 2)) prisma/schema.prisma > prisma/schema-fixed.tmp
    
    # Sostituisci il file originale
    mv prisma/schema-fixed.tmp prisma/schema.prisma
    
    echo -e "${GREEN}✅ Duplicati rimossi${NC}"
else
    echo -e "${RED}⚠️  I duplicati non sono dove ci aspettavamo. Verifica manuale necessaria.${NC}"
    echo "Le tabelle duplicate sembrano essere mescolate nel file."
    echo "Per sicurezza, non procedo automaticamente."
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}VALIDAZIONE SCHEMA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Formatta lo schema
npx prisma format

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema valido e formattato${NC}"
else
    echo -e "${RED}❌ Errore nella validazione dello schema${NC}"
    echo -e "${YELLOW}Ripristino del backup...${NC}"
    cp "$BACKUP_FILE" prisma/schema.prisma
    echo -e "${GREEN}Backup ripristinato${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}VERIFICA FINALE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Verifica che ora ci sia solo UNA occorrenza di ogni modello
PAYMENT_COUNT=$(grep -c "model Payment {" prisma/schema.prisma)
INVOICE_COUNT=$(grep -c "model Invoice {" prisma/schema.prisma)
PAYMENT_STATUS_COUNT=$(grep -c "enum PaymentStatus" prisma/schema.prisma)

echo "✓ Model Payment: $PAYMENT_COUNT occorrenza/e"
echo "✓ Model Invoice: $INVOICE_COUNT occorrenza/e"
echo "✓ Enum PaymentStatus: $PAYMENT_STATUS_COUNT occorrenza/e"

if [ $PAYMENT_COUNT -eq 1 ] && [ $INVOICE_COUNT -eq 1 ] && [ $PAYMENT_STATUS_COUNT -eq 1 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║    ✅ DUPLICATI RIMOSSI CON SUCCESSO!  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    
    echo ""
    echo "📋 PROSSIMI COMANDI DA ESEGUIRE:"
    echo ""
    echo "  1. Genera il client Prisma:"
    echo "     ${BLUE}npx prisma generate${NC}"
    echo ""
    echo "  2. Crea la migrazione:"
    echo "     ${BLUE}npx prisma migrate dev --name payment-system-fixed${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Alcune tabelle potrebbero ancora avere duplicati${NC}"
    echo "Verifica manuale consigliata con:"
    echo "  npx prisma studio"
fi
