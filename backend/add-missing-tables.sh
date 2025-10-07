#!/bin/bash

# Script per aggiungere SOLO le tabelle mancanti
# Data: 28/09/2025

echo "========================================="
echo "AGGIUNTA TABELLE MANCANTI PAGAMENTI"
echo "========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backup schema attuale
echo -e "${YELLOW}📦 Backup schema attuale...${NC}"
cp prisma/schema.prisma "prisma/schema.prisma.backup-before-payment-tables-$(date +%Y%m%d-%H%M%S)"
echo -e "${GREEN}✅ Backup creato${NC}"

# 2. Aggiungi solo le tabelle mancanti
echo -e "${YELLOW}📝 Aggiunta tabelle mancanti...${NC}"

# Aggiungi le tabelle mancanti alla fine del file
cat >> prisma/schema.prisma << 'EOF'

// ========================================
// TABELLE AGGIUNTE PER COMPLETARE SISTEMA PAGAMENTI
// Data: 28/09/2025
// ========================================

// Account Stripe Connect per professionisti
model StripeAccount {
  id                    String          @id @default(cuid())
  professionalId        String          @unique
  
  stripeAccountId       String          @unique
  accountType           String          @default("express")
  
  chargesEnabled        Boolean         @default(false)
  payoutsEnabled        Boolean         @default(false)
  detailsSubmitted      Boolean         @default(false)
  
  currentlyDue          Json?
  pastDue               Json?
  requirements          Json?
  capabilities          Json?
  
  defaultCurrency       String          @default("eur")
  payoutSchedule        Json?
  
  metadata              Json?
  businessProfile       Json?
  
  onboardingCompleted   Boolean         @default(false)
  onboardingUrl         String?         @db.Text
  refreshUrl            String?         @db.Text
  returnUrl             String?         @db.Text
  
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
  lastVerifiedAt        DateTime?
  
  professional          User            @relation("ProfessionalStripeAccount", fields: [professionalId], references: [id])
  
  @@index([professionalId])
  @@index([stripeAccountId])
}

// Split dei pagamenti
model PaymentSplit {
  id                    String          @id @default(cuid())
  paymentId             String
  professionalId        String
  
  grossAmount           Float
  platformFee           Float
  platformFeePercent    Float
  netAmount             Float
  
  splitType             String          @default("DEFERRED")
  
  payoutId              String?
  payoutStatus          String          @default("PENDING")
  
  stripeTransferId      String?
  transferredAt         DateTime?
  
  appliedRules          Json?
  
  createdAt             DateTime        @default(now())
  processedAt           DateTime?
  
  // Relations
  payment               Payment         @relation(fields: [paymentId], references: [id])
  professional          User            @relation("ProfessionalSplits", fields: [professionalId], references: [id])
  payout                Payout?         @relation(fields: [payoutId], references: [id])
  
  @@index([paymentId])
  @@index([professionalId])
  @@index([payoutId])
}

// Riconciliazione pagamenti
model PaymentReconciliation {
  id                    String          @id @default(cuid())
  
  periodStart           DateTime
  periodEnd             DateTime
  
  totalTransactions     Int
  totalVolume           Float
  totalFees             Float
  totalRefunds          Float
  netAmount             Float
  
  byPaymentType         Json
  byProfessional        Json
  byCategory            Json
  
  stripeReportId        String?
  stripeBalance         Float?
  stripePayouts         Float?
  stripeFees            Float?
  
  status                String          @default("DRAFT")
  
  reportFile            String?
  notes                 String?         @db.Text
  
  createdAt             DateTime        @default(now())
  createdBy             String?
  approvedAt            DateTime?
  approvedBy            String?
  
  createdByUser         User?           @relation("ReconciliationCreatedBy", fields: [createdBy], references: [id])
  approvedByUser        User?           @relation("ReconciliationApprovedBy", fields: [approvedBy], references: [id])
  
  @@index([periodStart, periodEnd])
  @@index([status])
}

// Abbonamenti ricorrenti
model Subscription {
  id                    String          @id @default(cuid())
  customerId            String
  professionalId        String?
  
  planId                String
  planName              String
  planType              String
  
  amount                Float
  currency              String          @default("EUR")
  interval              String
  intervalCount         Int             @default(1)
  
  status                String          @default("ACTIVE")
  
  startDate             DateTime
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  cancelledAt           DateTime?
  endedAt               DateTime?
  
  stripeSubscriptionId  String?         @unique
  stripeCustomerId      String?
  
  metadata              Json?
  notes                 String?         @db.Text
  
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
  
  customer              User            @relation("CustomerSubscriptions", fields: [customerId], references: [id])
  professional          User?           @relation("ProfessionalSubscriptions", fields: [professionalId], references: [id])
  
  @@index([customerId])
  @@index([professionalId])
  @@index([status])
  @@index([stripeSubscriptionId])
}
EOF

echo -e "${GREEN}✅ Tabelle aggiunte${NC}"

# 3. Formatta lo schema
echo -e "${YELLOW}🎨 Formattazione schema...${NC}"
npx prisma format

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema formattato correttamente${NC}"
else
    echo -e "${RED}❌ Errore nella formattazione${NC}"
    exit 1
fi

# 4. Genera client
echo -e "${YELLOW}🔧 Generazione client Prisma...${NC}"
npx prisma generate

# 5. Crea migration
echo -e "${YELLOW}🗄️ Creazione migration...${NC}"
npx prisma migrate dev --name complete-payment-system

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✅ SISTEMA PAGAMENTI COMPLETATO!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Tabelle aggiunte con successo:"
echo "  ✅ StripeAccount - Per Stripe Connect"
echo "  ✅ PaymentSplit - Per gestione split pagamenti"
echo "  ✅ PaymentReconciliation - Per riconciliazione"
echo "  ✅ Subscription - Per abbonamenti ricorrenti"
echo ""
echo "Il sistema di pagamento è ora completo!"
echo ""
echo "Prossimi passi:"
echo "1. Configura Stripe in .env"
echo "2. Registra le routes in app.ts"
echo "3. Testa con: npm run dev"
echo ""