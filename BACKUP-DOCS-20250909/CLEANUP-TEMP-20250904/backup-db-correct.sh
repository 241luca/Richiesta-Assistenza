#!/bin/bash

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backup/backup-completo-20250901-1500"

echo "🔒 BACKUP COMPLETO DATABASE"
echo "=========================="
echo "Timestamp: $TIMESTAMP"

# Parametri di connessione diretti
DB_USER="lucamambelli"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="assistenza_db"

# Backup completo database
echo "📦 Backup database $DB_NAME..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_DIR/database-backup-$TIMESTAMP.sql"

if [ $? -eq 0 ]; then
    echo "✅ Backup database completato: $BACKUP_DIR/database-backup-$TIMESTAMP.sql"
else
    echo "❌ Errore nel backup del database"
fi

# Backup schema Prisma
cp backend/prisma/schema.prisma "$BACKUP_DIR/schema.prisma.backup-$TIMESTAMP"
echo "✅ Backup schema Prisma completato"

# Backup file .env
cp backend/.env "$BACKUP_DIR/.env.backup-$TIMESTAMP"
echo "✅ Backup .env completato"

echo ""
echo "📁 Tutti i backup salvati in: $BACKUP_DIR"
echo "=========================="
