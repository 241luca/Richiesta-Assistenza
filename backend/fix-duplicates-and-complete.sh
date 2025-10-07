#!/bin/bash

# Script per rimuovere duplicati e completare il sistema pagamenti
# Data: 28/09/2025

echo "========================================="
echo "FIX DUPLICATI E COMPLETAMENTO SISTEMA"
echo "========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backup prima di modifiche
echo -e "${YELLOW}📦 Backup schema attuale...${NC}"
cp prisma/schema.prisma "prisma/schema.prisma.backup-fix-duplicates-$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Backup creato${NC}"

# 2. Rimuovi le righe duplicate nel modello User
echo -e "${YELLOW}🔧 Rimozione campi duplicati in User...${NC}"

# Usa un file temporaneo per le modifiche
TMP_FILE="prisma/schema.tmp"

# Rimuovi le righe duplicate mantenendo solo la prima occorrenza
awk '
/^model User {/,/^}/ {
    if (/PaymentReconciliation.*PaymentReconciliation\[\]/) {
        if (!seen_reconciliation++) print
    } else if (/Subscription.*Subscription\[\]/) {
        if (!seen_subscription++) print
    } else {
        print
    }
    next
}
{ print }
' prisma/schema.prisma > "$TMP_FILE"

# Sostituisci il file originale
mv "$TMP_FILE" prisma/schema.prisma

echo -e "${GREEN}✅ Duplicati rimossi${NC}"

# 3. Verifica se le tabelle mancanti esistono già
echo -e "${YELLOW}🔍 Verifica tabelle esistenti...${NC}"

HAS_STRIPE_ACCOUNT=false
HAS_PAYMENT_SPLIT=false
HAS_PAYMENT_RECONCILIATION=false
HAS_SUBSCRIPTION=false

if grep -q "model StripeAccount " prisma/schema.prisma; then
    echo -e "${GREEN}✅ StripeAccount trovata${NC}"
    HAS_STRIPE_ACCOUNT=true
else
    echo -e "${YELLOW}⚠️ StripeAccount mancante${NC}"
fi

if grep -q "model PaymentSplit " prisma/schema.prisma; then
    echo -e "${GREEN}✅ PaymentSplit trovata${NC}"
    HAS_PAYMENT_SPLIT=true
else
    echo -e "${YELLOW}⚠️ PaymentSplit mancante${NC}"
fi

if grep -q "model PaymentReconciliation " prisma/schema.prisma; then
    echo -e "${GREEN}✅ PaymentReconciliation trovata${NC}"
    HAS_PAYMENT_RECONCILIATION=true
else
    echo -e "${YELLOW}⚠️ PaymentReconciliation mancante${NC}"
fi

if grep -q "model Subscription " prisma/schema.prisma; then
    echo -e "${GREEN}✅ Subscription trovata${NC}"
    HAS_SUBSCRIPTION=true
else
    echo -e "${YELLOW}⚠️ Subscription mancante${NC}"
fi

# 4. Formatta per verificare la validità
echo -e "${YELLOW}🎨 Test formattazione schema...${NC}"
npx prisma format

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema valido!${NC}"
else
    echo -e "${RED}❌ Ci sono ancora errori nello schema${NC}"
    echo -e "${YELLOW}Controllare manualmente prisma/schema.prisma${NC}"
    exit 1
fi

# 5. Genera client
echo -e "${YELLOW}🔧 Generazione client Prisma...${NC}"
npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Client generato con successo${NC}"
else
    echo -e "${RED}❌ Errore nella generazione del client${NC}"
    exit 1
fi

# 6. Se tutto è ok, crea la migration
echo -e "${YELLOW}🗄️ Creazione migration database...${NC}"
npx prisma migrate dev --name fix-payment-system-tables --skip-seed

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ SISTEMA CORRETTO E PRONTO!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# Report finale
echo "Stato tabelle:"
[ "$HAS_STRIPE_ACCOUNT" = true ] && echo "  ✅ StripeAccount" || echo "  ❌ StripeAccount (da aggiungere)"
[ "$HAS_PAYMENT_SPLIT" = true ] && echo "  ✅ PaymentSplit" || echo "  ❌ PaymentSplit (da aggiungere)"
[ "$HAS_PAYMENT_RECONCILIATION" = true ] && echo "  ✅ PaymentReconciliation" || echo "  ❌ PaymentReconciliation (da aggiungere)"
[ "$HAS_SUBSCRIPTION" = true ] && echo "  ✅ Subscription" || echo "  ❌ Subscription (da aggiungere)"

echo ""
echo "Prossimi passi:"
echo "1. Se mancano tabelle, aggiungile manualmente"
echo "2. Configura Stripe nel file .env"
echo "3. Registra le routes in app.ts"
echo "4. Testa con: npm run dev"
echo ""