#!/bin/bash

# Script per aggiungere il sistema di pagamenti al database
# Data: 28/09/2025

echo "========================================="
echo "INSTALLAZIONE SISTEMA PAGAMENTI"
echo "========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backup schema attuale
echo -e "${YELLOW}📦 Creazione backup schema attuale...${NC}"
cp prisma/schema.prisma "prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Backup creato${NC}"

# 2. Aggiunta nuove tabelle
echo -e "${YELLOW}📝 Aggiunta tabelle sistema pagamenti...${NC}"
cat prisma/add-payment-system.prisma >> prisma/schema.prisma
echo -e "${GREEN}✅ Tabelle aggiunte${NC}"

# 3. Formattazione schema
echo -e "${YELLOW}🎨 Formattazione schema...${NC}"
npx prisma format
echo -e "${GREEN}✅ Schema formattato${NC}"

# 4. Generazione client Prisma
echo -e "${YELLOW}🔧 Generazione client Prisma...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Client generato${NC}"

# 5. Creazione migration
echo -e "${YELLOW}🗄️ Creazione migration database...${NC}"
npx prisma migrate dev --name add-payment-system --skip-seed

# 6. Installazione dipendenze
echo -e "${YELLOW}📦 Installazione dipendenze Stripe...${NC}"
npm install stripe pdfkit

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ INSTALLAZIONE COMPLETATA!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Prossimi passi:"
echo "1. Configura le variabili ambiente in .env:"
echo "   - STRIPE_SECRET_KEY=sk_test_..."
echo "   - STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "2. Registra le nuove routes in src/app.ts"
echo ""
echo "3. Testa il sistema con:"
echo "   npm run dev"
echo ""