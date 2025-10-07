#!/bin/bash

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "📦 Backup finale..."
cp prisma/schema.prisma "prisma/schema.prisma.backup3-$(date +%Y%m%d-%H%M%S)"

echo "🔧 Correzione manuale riga 3110..."

# Leggo il file, sostituisco la riga 3110 esatta
head -n 3109 prisma/schema.prisma > prisma/schema.prisma.new

# Aggiungo le righe corrette
cat >> prisma/schema.prisma.new << 'EOF'
  blockOverlimit          Boolean @default(true)
  notifyLargeTransactions Float?
  manualReviewThreshold   Float?

  // Stripe Connect
  stripeConnectId     String?
  stripeAccountStatus String? @default("pending")

  // Fatturazione
  invoiceProvider     String?
  invoiceApiKey       String?
  invoiceAutoGenerate Boolean @default(false)

  // Dati fatturazione
  businessName String?
  vatNumber    String?
  taxCode      String?
  sdiCode      String?
  pecEmail     String?

  // Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  updatedBy String?

  // Note e stato
  adminNotes String? @db.Text
  riskLevel  String? @default("LOW")
  status     String  @default("ACTIVE")

  professional  User  @relation(fields: [professionalId], references: [id])
  updatedByUser User? @relation("PaymentSettingsUpdatedBy", fields: [updatedBy], references: [id])
}

EOF

# Aggiungo tutto dal commento in poi (riga 3111)
tail -n +3111 prisma/schema.prisma >> prisma/schema.prisma.new

# Sostituisco il file
mv prisma/schema.prisma.new prisma/schema.prisma

echo "✅ Correzione completata!"
echo ""
echo "🔧 Ora verifica con: npx prisma validate"
