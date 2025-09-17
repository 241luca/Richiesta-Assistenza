#!/bin/bash

# Backup script per modifiche profession
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "📦 Creazione backup per tabellazione campo profession..."

# Backup dello schema Prisma
cp backend/prisma/schema.prisma "backend/prisma/schema.backup-profession-$TIMESTAMP.prisma"

# Backup delle pagine competenze
cp src/pages/admin/professionals/competenze/ProfessionalCompetenze.tsx "src/pages/admin/professionals/competenze/ProfessionalCompetenze.backup-profession-$TIMESTAMP.tsx"

# Backup della lista professionisti
cp src/pages/admin/ProfessionalsList.tsx "src/pages/admin/ProfessionalsList.backup-profession-$TIMESTAMP.tsx"

echo "✅ Backup completato con timestamp: $TIMESTAMP"
echo ""
echo "Files salvati:"
echo "- schema.backup-profession-$TIMESTAMP.prisma"
echo "- ProfessionalCompetenze.backup-profession-$TIMESTAMP.tsx"
echo "- ProfessionalsList.backup-profession-$TIMESTAMP.tsx"
