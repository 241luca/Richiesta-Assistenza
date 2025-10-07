#!/bin/bash

# Fix definitivo schema Prisma
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "📦 Backup..."
cp prisma/schema.prisma "prisma/schema.prisma.backup2-$(date +%Y%m%d-%H%M%S)"

echo "🔧 Correzione con sed..."

# Creo un file temporaneo con la correzione
cat prisma/schema.prisma | awk '
/blockOverlimit.*Boolean.*@default.*true.*\/\// {
    print "  blockOverlimit          Boolean @default(true)"
    print "  notifyLargeTransactions Float?"
    print "  manualReviewThreshold   Float?"
    print ""
    print "  // Stripe Connect"
    print "  stripeConnectId     String?"
    print "  stripeAccountStatus String? @default(\"pending\")"
    print ""
    print "  // Fatturazione"
    print "  invoiceProvider     String?"
    print "  invoiceApiKey       String?"
    print "  invoiceAutoGenerate Boolean @default(false)"
    print ""
    print "  // Dati fatturazione"
    print "  businessName String?"
    print "  vatNumber    String?"
    print "  taxCode      String?"
    print "  sdiCode      String?"
    print "  pecEmail     String?"
    print ""
    print "  // Audit"
    print "  createdAt DateTime @default(now())"
    print "  updatedAt DateTime @updatedAt"
    print "  updatedBy String?"
    print ""
    print "  // Note e stato"
    print "  adminNotes String? @db.Text"
    print "  riskLevel  String? @default(\"LOW\")"
    print "  status     String  @default(\"ACTIVE\")"
    print ""
    print "  professional  User  @relation(fields: [professionalId], references: [id])"
    print "  updatedByUser User? @relation(\"PaymentSettingsUpdatedBy\", fields: [updatedBy], references: [id])"
    print "}"
    print ""
    next
}
{ print }
' > prisma/schema.prisma.tmp

mv prisma/schema.prisma.tmp prisma/schema.prisma

echo "✅ Prima correzione fatta!"
echo "🔧 Ora sistemo gli enum..."

# Sistemo gli enum - rimuovo i commenti inline
sed -i '' 's/CORE.*\/\/ Funzioni/CORE/' prisma/schema.prisma
sed -i '' 's/BUSINESS.*\/\/ Logica/BUSINESS/' prisma/schema.prisma  
sed -i '' 's/COMMUNICATION.*\/\/ Comunicazione/COMMUNICATION/' prisma/schema.prisma
sed -i '' 's/ADVANCED.*\/\/ Funzionalità/ADVANCED/' prisma/schema.prisma
sed -i '' 's/REPORTING.*\/\/ Reportistica/REPORTING/' prisma/schema.prisma
sed -i '' 's/AUTOMATION.*\/\/ Automazione/AUTOMATION/' prisma/schema.prisma
sed -i '' 's/INTEGRATIONS.*\/\/ Integrazioni/INTEGRATIONS/' prisma/schema.prisma
sed -i '' 's/ADMIN.*\/\/ Amministrazione/ADMIN/' prisma/schema.prisma

echo "✅ Tutto fatto!"
echo ""
echo "Ora prova: npx prisma validate"
