#!/bin/bash

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backup/backup-completo-20250901-1500"

echo "🔒 BACKUP COMPLETO DATABASE"
echo "=========================="
echo "Timestamp: $TIMESTAMP"

# Leggi le credenziali dal .env
source backend/.env

# Estrai i parametri di connessione dalla DATABASE_URL
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "❌ Errore: DATABASE_URL non valida"
    exit 1
fi

# Backup completo database
echo "📦 Backup database $DB_NAME..."
PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_DIR/database-backup-$TIMESTAMP.sql"

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
