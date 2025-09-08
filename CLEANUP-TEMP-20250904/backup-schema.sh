#!/bin/bash

TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🔒 BACKUP SCHEMA PRISMA"
echo "======================"

cd backend

# Backup dello schema attuale
cp prisma/schema.prisma "prisma/schema.prisma.backup-$TIMESTAMP"

echo "✅ Backup creato: prisma/schema.prisma.backup-$TIMESTAMP"

# Mostra le dimensioni
ls -lh prisma/schema.prisma*
