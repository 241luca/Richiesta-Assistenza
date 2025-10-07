#!/bin/bash

# Script di correzione schema Prisma
# Fix per model ProfessionalPaymentSettings incompleto

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "📦 Backup del file originale..."
cp prisma/schema.prisma "prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)"

echo "🔧 Applicazione correzioni..."

# Uso perl perché è più potente di sed su Mac
perl -i -pe '
  # Fix 1: Quando trovo blockOverlimit senza newline dopo, aggiungo i campi mancanti
  if (/blockOverlimit\s+Boolean\s+@default\(true\)\/\//) {
    $_ = "  blockOverlimit          Boolean \@default(true)\n" .
         "  notifyLargeTransactions Float?\n" .
         "  manualReviewThreshold   Float?\n\n" .
         "  // Stripe Connect\n" .
         "  stripeConnectId     String?\n" .
         "  stripeAccountStatus String? \@default(\"pending\")\n\n" .
         "  // Fatturazione\n" .
         "  invoiceProvider     String?\n" .
         "  invoiceApiKey       String?\n" .
         "  invoiceAutoGenerate Boolean \@default(false)\n\n" .
         "  // Dati fatturazione\n" .
         "  businessName String?\n" .
         "  vatNumber    String?\n" .
         "  taxCode      String?\n" .
         "  sdiCode      String?\n" .
         "  pecEmail     String?\n\n" .
         "  // Audit\n" .
         "  createdAt DateTime \@default(now())\n" .
         "  updatedAt DateTime \@updatedAt\n" .
         "  updatedBy String?\n\n" .
         "  // Note e stato\n" .
         "  adminNotes String? \@db.Text\n" .
         "  riskLevel  String? \@default(\"LOW\")\n" .
         "  status     String  \@default(\"ACTIVE\")\n\n" .
         "  professional  User  \@relation(fields: [professionalId], references: [id])\n" .
         "  updatedByUser User? \@relation(\"PaymentSettingsUpdatedBy\", fields: [updatedBy], references: [id])\n" .
         "}\n\n//";
  }
  
  # Fix 2: Rimuovo i commenti inline dagli enum
  s/CORE\s+\/\/ Funzioni essenziali.*/CORE/;
  s/BUSINESS\s+\/\/ Logica business.*/BUSINESS/;
  s/COMMUNICATION\s+\/\/ Comunicazione.*/COMMUNICATION/;
  s/ADVANCED\s+\/\/ Funzionalità avanzate.*/ADVANCED/;
  s/REPORTING\s+\/\/ Reportistica.*/REPORTING/;
  s/AUTOMATION\s+\/\/ Automazione.*/AUTOMATION/;
  s/INTEGRATIONS\s+\/\/ Integrazioni esterne.*/INTEGRATIONS/;
  s/ADMIN\s+\/\/ Amministrazione.*/ADMIN/;
' prisma/schema.prisma

echo "🗑️  Rimozione campi duplicati..."

# Ora rimuovo le righe duplicate (i campi orfani) dopo enum ModuleAction
perl -i -0777 -pe '
  # Trova e rimuovi tutto tra la chiusura di ModuleAction e model Payment
  s/(enum ModuleAction \{[^}]+\})\s+([\s\S]*?)(model Payment)/\1\n\n\3/g;
' prisma/schema.prisma

echo "✅ Correzione completata!"
echo ""
echo "📋 Verifica correzione:"
echo "npx prisma validate"
echo ""
echo "Se tutto OK, genera il client:"
echo "npx prisma generate"
echo "npx prisma db push"
