#!/bin/bash

# SCRIPT DI CORREZIONE SCHEMA PRISMA
# Problema: model ProfessionalPaymentSettings incompleto + enum con commenti inline

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# 1. BACKUP DEL FILE ORIGINALE
echo "📦 Creazione backup..."
cp prisma/schema.prisma prisma/schema.prisma.backup-prima-fix-$(date +%Y%m%d-%H%M%S)

# 2. CORREZIONE: Cerco e sostituisco la riga problematica
echo "🔧 Correzione in corso..."

# Creo un file temporaneo con le correzioni
cat > /tmp/fix-schema.sed << 'EOF'
# Dopo blockOverlimit, prima di // ============================================
/blockOverlimit.*Boolean.*@default.*true/{
a\
\
  notifyLargeTransactions Float?\
  manualReviewThreshold   Float?\
\
  stripeConnectId     String?\
  stripeAccountStatus String? @default("pending")\
\
  invoiceProvider     String?\
  invoiceApiKey       String?\
  invoiceAutoGenerate Boolean @default(false)\
\
  businessName String?\
  vatNumber    String?\
  taxCode      String?\
  sdiCode      String?\
  pecEmail     String?\
\
  createdAt DateTime @default(now())\
  updatedAt DateTime @updatedAt\
  updatedBy String?\
\
  adminNotes String? @db.Text\
  riskLevel  String? @default("LOW")\
  status     String  @default("ACTIVE")\
\
  professional  User  @relation(fields: [professionalId], references: [id])\
  updatedByUser User? @relation("PaymentSettingsUpdatedBy", fields: [updatedBy], references: [id])\
}
}

# Rimuovo linee duplicate (i campi orfani che verranno poi cancellati)
/^  notifyLargeTransactions Float?$/d
/^  manualReviewThreshold   Float?$/d
/^  stripeConnectId     String?$/d
/^  stripeAccountStatus String? @default\("pending"\)$/d
/^  invoiceProvider     String?/d
/^  invoiceApiKey       String?/d
/^  invoiceAutoGenerate Boolean @default\(false\)$/d
/^  businessName String?$/d
/^  vatNumber    String?$/d
/^  taxCode      String?$/d
/^  sdiCode      String?/d
/^  pecEmail     String?$/d
/^  createdAt DateTime @default\(now\(\)\)$/d
/^  updatedAt DateTime @updatedAt$/d
/^  updatedBy String?$/d
/^  adminNotes String? @db\.Text$/d
/^  riskLevel  String? @default\("LOW"\)/d
/^  status     String  @default\("ACTIVE"\)/d
/^  professional  User  @relation/d
/^  updatedByUser User? @relation\("PaymentSettingsUpdatedBy"/d
/^}$/d

# Sistemo gli enum rimuovendo i commenti inline
s/CORE.*\/\/ Funzioni essenziali.*/CORE/
s/BUSINESS.*\/\/ Logica business.*/BUSINESS/
s/COMMUNICATION.*\/\/ Comunicazione.*/COMMUNICATION/
s/ADVANCED.*\/\/ Funzionalità avanzate.*/ADVANCED/
s/REPORTING.*\/\/ Reportistica.*/REPORTING/
s/AUTOMATION.*\/\/ Automazione.*/AUTOMATION/
s/INTEGRATIONS.*\/\/ Integrazioni esterne.*/INTEGRATIONS/
s/ADMIN.*\/\/ Amministrazione.*/ADMIN/
EOF

# Applico le correzioni
sed -f /tmp/fix-schema.sed prisma/schema.prisma > prisma/schema.prisma.tmp
mv prisma/schema.prisma.tmp prisma/schema.prisma

echo "✅ Correzione completata!"
echo ""
echo "📋 Prossimi passi:"
echo "1. Verifica il file con: npx prisma validate"
echo "2. Se tutto OK, genera client: npx prisma generate"
echo "3. Sincronizza DB: npx prisma db push"
echo ""
echo "⚠️  Backup salvato in: prisma/schema.prisma.backup-prima-fix-*"
