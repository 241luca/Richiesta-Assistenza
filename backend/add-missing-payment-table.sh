#!/bin/bash
# Script per aggiungere la tabella ProfessionalPaymentSettings mancante
# Data: 29/01/2025

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "=== Aggiungo tabella ProfessionalPaymentSettings ==="

# Backup dello schema attuale
cp prisma/schema.prisma prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)

# Aggiungo la tabella mancante alla fine del file
cat >> prisma/schema.prisma << 'EOF'

model ProfessionalPaymentSettings {
  id                    String   @id @default(cuid())
  professionalId        String   @unique
  paymentMode           String   @default("MANAGED")
  payoutFrequency       String   @default("WEEKLY")
  payoutDay             Int?
  minimumPayout         Float    @default(50.00)
  holdingDays           Int      @default(7)
  autoPayout            Boolean  @default(true)
  requireApproval       Boolean  @default(false)
  paymentMethods        Json?
  primaryMethod         String?
  bankDetails           Json?
  useStandardFees       Boolean  @default(true)
  customFees            Json?
  volumeTiers           Json?
  maxTransaction        Float?
  maxDaily              Float?
  maxMonthly            Float?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  professional          User     @relation("ProfessionalPaymentSettings", fields: [professionalId], references: [id])
  
  @@index([professionalId])
}
EOF

echo "✅ Tabella aggiunta al file schema.prisma"

# Genera il client Prisma
echo "Generazione client Prisma..."
npx prisma generate

echo "✅ Client Prisma generato"

# Push al database
echo "Applicazione modifiche al database..."
npx prisma db push --skip-generate

echo "✅ Tabella creata nel database"
echo "=== Completato ==="
