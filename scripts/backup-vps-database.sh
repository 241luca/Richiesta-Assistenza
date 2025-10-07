#!/bin/bash

# BACKUP AUTOMATICO PRIMA DI OGNI DEPLOY
# Mai perdere dati!

echo "💾 BACKUP PRE-DEPLOY"
echo "==================="

# Configurazione
VPS_IP="95.217.123.456"  # IP del tuo VPS
VPS_USER="root"
DB_NAME="richiesta_assistenza"
BACKUP_DIR="/home/backups"

# Data e ora per nome file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DB_NAME}_${TIMESTAMP}.sql"

echo "🔄 Connessione al VPS..."

# Esegui backup sul VPS
ssh $VPS_USER@$VPS_IP << ENDSSH
echo "📦 Creazione backup database..."

# Crea directory se non esiste
mkdir -p $BACKUP_DIR

# Backup completo database
pg_dump $DB_NAME > $BACKUP_DIR/$BACKUP_FILE

# Comprimi
gzip $BACKUP_DIR/$BACKUP_FILE

# Mostra dimensione
ls -lh $BACKUP_DIR/${BACKUP_FILE}.gz

echo "✅ Backup completato: ${BACKUP_FILE}.gz"

# Tieni solo ultimi 30 backup
echo "🧹 Pulizia vecchi backup..."
cd $BACKUP_DIR
ls -t *.gz | tail -n +31 | xargs -r rm

echo "📊 Backup disponibili:"
ls -lh *.gz | head -5
ENDSSH

echo ""
echo "✅ BACKUP COMPLETATO!"
echo "📁 Posizione: $BACKUP_DIR/${BACKUP_FILE}.gz"
echo ""
echo "🔄 Per ripristinare in caso di problemi:"
echo "   gunzip < ${BACKUP_FILE}.gz | psql $DB_NAME"
