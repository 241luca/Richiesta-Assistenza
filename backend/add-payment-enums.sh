#!/bin/bash

# Script per aggiungere ENUM mancanti per il sistema pagamenti
# Data: 29/01/2025

echo "========================================="
echo "AGGIUNTA ENUM PAYMENT AL DATABASE"
echo "========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backup schema attuale
echo -e "${YELLOW}📦 Backup schema attuale...${NC}"
cp prisma/schema.prisma "prisma/schema.prisma.backup-enums-$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Backup creato${NC}"

# 2. Creare file temporaneo con gli enum da aggiungere
echo -e "${YELLOW}📝 Creazione ENUM Payment...${NC}"

cat > prisma/payment-enums.prisma << 'EOF'

// ========================================
// ENUM PER SISTEMA PAGAMENTI
// Aggiunti il 29/01/2025
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

echo -e "${GREEN}✅ File enum creato${NC}"

# 3. Aggiungere STRIPE ad ApiKeyService
echo -e "${YELLOW}🔧 Aggiunta STRIPE ad ApiKeyService...${NC}"

# Usa sed per aggiungere STRIPE prima della chiusura dell'enum
sed -i.bak '/enum ApiKeyService {/,/}/ {
    /WHATSAPP/ a\
  STRIPE
}' prisma/schema.prisma

echo -e "${GREEN}✅ STRIPE aggiunto ad ApiKeyService${NC}"

# 4. Aggiungere gli enum alla fine del file schema.prisma
echo -e "${YELLOW}📋 Aggiunta enum al schema...${NC}"
cat prisma/payment-enums.prisma >> prisma/schema.prisma
echo -e "${GREEN}✅ Enum aggiunti${NC}"

# 5. Pulire file temporaneo
rm prisma/payment-enums.prisma

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ ENUM AGGIUNTI CON SUCCESSO!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Ora puoi eseguire:"
echo "  npx prisma generate"
echo "  npx prisma migrate dev --name add-payment-enums"
