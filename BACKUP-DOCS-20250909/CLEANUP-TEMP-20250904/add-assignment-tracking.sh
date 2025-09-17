#!/bin/bash

echo "📝 Aggiungendo campi per tracciamento assegnazione..."

# Backup dello schema attuale
cp backend/prisma/schema.prisma backup-filtro-sottocategorie-20250102/schema.prisma.backup

# Aggiungi l'enum AssignmentType dopo gli altri enum esistenti
# Dobbiamo modificare lo schema manualmente perché Prisma richiede sintassi specifica

cat << 'EOF' > add-assignment-fields.sql
-- Aggiungi campi per tracciamento assegnazione
ALTER TABLE "AssistanceRequest" 
ADD COLUMN IF NOT EXISTS "assignmentType" TEXT,
ADD COLUMN IF NOT EXISTS "assignedBy" TEXT,
ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3);

-- Aggiungi constraint per assignmentType
ALTER TABLE "AssistanceRequest"
ADD CONSTRAINT "assignment_type_check" 
CHECK ("assignmentType" IN ('STAFF', 'SELF', 'AUTOMATIC') OR "assignmentType" IS NULL);

-- Crea indice per performance
CREATE INDEX IF NOT EXISTS "AssistanceRequest_assignedBy_idx" ON "AssistanceRequest"("assignedBy");
CREATE INDEX IF NOT EXISTS "AssistanceRequest_assignmentType_idx" ON "AssistanceRequest"("assignmentType");
EOF

echo "✅ Script SQL creato: add-assignment-fields.sql"
echo ""
echo "Per applicare le modifiche:"
echo "1. Esegui: psql \$DATABASE_URL < add-assignment-fields.sql"
echo "2. Aggiorna schema.prisma con i nuovi campi"
echo "3. Esegui: npx prisma db pull"
echo "4. Esegui: npx prisma generate"
