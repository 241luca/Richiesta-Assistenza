#!/bin/bash
# Backup script per schema Prisma - SESSIONE 1 Sistema Moduli

cd "$(dirname "$0")"

# Crea backup con timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="prisma/schema.prisma.backup-$TIMESTAMP"

echo "🔄 Creando backup schema Prisma..."
cp prisma/schema.prisma "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup creato: $BACKUP_FILE"
else
    echo "❌ Errore nella creazione del backup"
    exit 1
fi
