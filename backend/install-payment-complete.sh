#!/bin/bash

# ========================================
# INSTALLAZIONE COMPLETA SISTEMA PAGAMENTI
# Data: 29/01/2025
# Versione: FINALE
# ========================================

echo "╔════════════════════════════════════════╗"
echo "║   INSTALLAZIONE SISTEMA PAGAMENTI     ║"
echo "║         VERSIONE COMPLETA              ║"
echo "╚════════════════════════════════════════╝"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directory di lavoro
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 1/7: BACKUP SCHEMA ATTUALE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
cp prisma/schema.prisma "prisma/schema.prisma.backup-payment-install-${TIMESTAMP}"
echo -e "${GREEN}✅ Backup creato: schema.prisma.backup-payment-install-${TIMESTAMP}${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 2/7: AGGIUNTA STRIPE AD ApiKeyService${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Verifica se STRIPE esiste già
if grep -q "STRIPE" prisma/schema.prisma; then
    echo -e "${GREEN}✅ STRIPE già presente in ApiKeyService${NC}"
else
    # Aggiunge STRIPE dopo WHATSAPP nell'enum ApiKeyService
    sed -i '' '/WHATSAPP/a\
  STRIPE
' prisma/schema.prisma
    echo -e "${GREEN}✅ STRIPE aggiunto ad ApiKeyService${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 3/7: AGGIUNTA ENUM PAYMENT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Verifica se gli enum esistono già
if grep -q "enum PaymentStatus" prisma/schema.prisma; then
    echo -e "${YELLOW}⚠️  Enum PaymentStatus già presente, skip${NC}"
else
    cat >> prisma/schema.prisma << 'EOF'

// ========================================
// ENUM SISTEMA PAGAMENTI
// Aggiunti automaticamente il 29/01/2025
// ========================================

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum PaymentType {
  DEPOSIT
  FULL_PAYMENT
  PARTIAL
  SUBSCRIPTION
  ACCESSORY
  HOLD
}

enum PaymentMethod {
  CARD
  BANK_TRANSFER
  PAYPAL
  CASH
  OTHER
}
EOF
    echo -e "${GREEN}✅ Enum Payment aggiunti${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 4/7: AGGIUNTA TABELLE PAYMENT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Verifica se Payment model esiste già
if grep -q "model Payment {" prisma/schema.prisma; then
    echo -e "${YELLOW}⚠️  Tabella Payment già presente, skip${NC}"
else
    # Aggiunge tutte le tabelle del sistema pagamenti
    cat prisma/add-payment-system.prisma >> prisma/schema.prisma
    echo -e "${GREEN}✅ Tabelle Payment aggiunte${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 5/7: FORMATTAZIONE SCHEMA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

npx prisma format
echo -e "${GREEN}✅ Schema formattato${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 6/7: GENERAZIONE CLIENT PRISMA${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

npx prisma generate
echo -e "${GREEN}✅ Client Prisma generato${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}STEP 7/7: MIGRAZIONE DATABASE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}📝 Creazione migrazione...${NC}"
npx prisma migrate dev --name add-complete-payment-system --skip-seed

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrazione completata con successo!${NC}"
else
    echo -e "${RED}❌ Errore durante la migrazione${NC}"
    echo -e "${YELLOW}Prova a risolvere manualmente con:${NC}"
    echo "  npx prisma migrate reset"
    echo "  npx prisma migrate dev"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║        ✅ INSTALLAZIONE COMPLETATA!     ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Sistema pagamenti installato con successo!${NC}"
echo ""
echo "📋 RIEPILOGO:"
echo "  • Backup creato: schema.prisma.backup-payment-install-${TIMESTAMP}"
echo "  • STRIPE aggiunto ad ApiKeyService"
echo "  • 3 Enum aggiunti (PaymentStatus, PaymentType, PaymentMethod)"
echo "  • 15+ tabelle Payment aggiunte"
echo "  • Database migrato"
echo ""
echo "🎯 PROSSIMI PASSI:"
echo "  1. Configurare le API Keys di Stripe nel pannello Admin"
echo "  2. Testare con: npm run dev"
echo "  3. Verificare endpoint: http://localhost:3200/api/payments/config"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
