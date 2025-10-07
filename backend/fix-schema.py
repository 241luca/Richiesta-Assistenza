#!/usr/bin/env python3
"""
Script per correggere lo schema Prisma
Problema: model ProfessionalPaymentSettings incompleto + enum con commenti inline
"""

import re
from datetime import datetime

# File paths
SCHEMA_FILE = "/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/prisma/schema.prisma"
BACKUP_FILE = f"/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/prisma/schema.prisma.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

print("🔧 Inizio correzione schema.prisma...")

# 1. Backup
print(f"📦 Creazione backup in: {BACKUP_FILE}")
with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
    content = f.read()
    
with open(BACKUP_FILE, 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Fix model ProfessionalPaymentSettings - aggiungo chiusura
print("🔧 Correzione model ProfessionalPaymentSettings...")

# Cerco la riga "blockOverlimit" e aggiungo i campi mancanti + chiusura
pattern = r'(blockOverlimit\s+Boolean\s+@default\(true\))\s*// ===='
replacement = r'''blockOverlimit          Boolean @default(true)

  notifyLargeTransactions Float?
  manualReviewThreshold   Float?

  // Stripe Connect (se AUTONOMOUS)
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

// ===='''

content = re.sub(pattern, replacement, content)

# 3. Rimuovo i campi duplicati (righe orfane) tra enum ModuleAction e model Payment
print("🗑️  Rimozione campi duplicati...")

# Pattern per rimuovere tutto tra "enum ModuleAction" e "model Payment"
# che contiene i campi orfani
lines = content.split('\n')
new_lines = []
skip = False
skip_count = 0

for i, line in enumerate(lines):
    # Inizio skip dopo "enum ModuleAction {" quando vedo la chiusura "}"
    if 'enum ModuleAction' in line:
        skip_section_start = i
        
    # Cerco la fine dell'enum ModuleAction
    if skip_section_start and line.strip() == '}' and skip_count == 0:
        # Questo è la fine di ModuleAction, inizia lo skip delle righe orfane
        new_lines.append(line)
        skip = True
        skip_count += 1
        continue
        
    # Fine skip quando trovo "model Payment" o altro model
    if skip and line.strip().startswith('model ') and 'Payment' in line:
        skip = False
        
    # Aggiungo la riga solo se non stiamo skippando
    if not skip:
        new_lines.append(line)

content = '\n'.join(new_lines)

# 4. Fix enum con commenti inline
print("🔧 Fix enum con commenti inline...")

# ModuleCategory
content = re.sub(r'CORE\s+//.*', 'CORE', content)
content = re.sub(r'BUSINESS\s+//.*', 'BUSINESS', content)
content = re.sub(r'COMMUNICATION\s+//.*', 'COMMUNICATION', content)
content = re.sub(r'ADVANCED\s+//.*', 'ADVANCED', content)
content = re.sub(r'REPORTING\s+//.*', 'REPORTING', content)
content = re.sub(r'AUTOMATION\s+//.*', 'AUTOMATION', content)
content = re.sub(r'INTEGRATIONS\s+//.*', 'INTEGRATIONS', content)
content = re.sub(r'ADMIN\s+//.*', 'ADMIN', content)

# 5. Salvo il file corretto
print("💾 Salvataggio file corretto...")
with open(SCHEMA_FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Correzione completata!")
print("")
print("📋 Prossimi passi:")
print("1. cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend")
print("2. npx prisma validate")
print("3. npx prisma generate")
print("4. npx prisma db push")
print("")
print(f"⚠️  Backup salvato in: {BACKUP_FILE}")
