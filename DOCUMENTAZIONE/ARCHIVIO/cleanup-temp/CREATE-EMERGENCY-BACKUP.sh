#!/bin/bash

echo "🚨 CREAZIONE BACKUP COMPLETO DI EMERGENZA"
echo "========================================="
echo ""
echo "Questo script crea un backup COMPLETO del database"
echo "direttamente con pg_dump per sicurezza massima!"
echo ""

# Configurazione
DB_URL="postgresql://postgres:postgres@localhost:5432/richiesta_assistenza"
BACKUP_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/BACKUP-EMERGENZA"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Crea directory di backup se non esiste
mkdir -p "$BACKUP_DIR"

echo "📁 Directory backup: $BACKUP_DIR"
echo ""

# 1. BACKUP DATABASE CON PG_DUMP
echo "1️⃣ Creando backup database con pg_dump..."
DUMP_FILE="$BACKUP_DIR/database-dump-$TIMESTAMP.sql"

# Esegui pg_dump
pg_dump "$DB_URL" > "$DUMP_FILE" 2>/dev/null

if [ -f "$DUMP_FILE" ]; then
  size=$(ls -lh "$DUMP_FILE" | awk '{print $5}')
  echo "✅ Database backup creato: $DUMP_FILE ($size)"
else
  echo "❌ ERRORE: Impossibile creare backup database!"
  echo "   Verifica che PostgreSQL sia in esecuzione"
  exit 1
fi

# 2. BACKUP FILE UPLOADS
echo ""
echo "2️⃣ Copiando file uploads..."
UPLOADS_SOURCE="/Users/lucamambelli/Desktop/richiesta-assistenza/uploads"
UPLOADS_BACKUP="$BACKUP_DIR/uploads-$TIMESTAMP"

if [ -d "$UPLOADS_SOURCE" ]; then
  cp -r "$UPLOADS_SOURCE" "$UPLOADS_BACKUP"
  echo "✅ Uploads copiati in: $UPLOADS_BACKUP"
else
  echo "⚠️ Directory uploads non trovata"
fi

# 3. BACKUP CONFIGURAZIONE
echo ""
echo "3️⃣ Salvando configurazione..."
CONFIG_BACKUP="$BACKUP_DIR/config-$TIMESTAMP"
mkdir -p "$CONFIG_BACKUP"

# Copia file di configurazione importanti
cp /Users/lucamambelli/Desktop/richiesta-assistenza/.env "$CONFIG_BACKUP/" 2>/dev/null
cp /Users/lucamambelli/Desktop/richiesta-assistenza/backend/.env "$CONFIG_BACKUP/backend.env" 2>/dev/null
cp /Users/lucamambelli/Desktop/richiesta-assistenza/package.json "$CONFIG_BACKUP/" 2>/dev/null
cp /Users/lucamambelli/Desktop/richiesta-assistenza/backend/package.json "$CONFIG_BACKUP/backend-package.json" 2>/dev/null

echo "✅ Configurazione salvata in: $CONFIG_BACKUP"

# 4. CREA ARCHIVIO COMPRESSO
echo ""
echo "4️⃣ Creando archivio compresso..."
ARCHIVE_FILE="$BACKUP_DIR/BACKUP-COMPLETO-$TIMESTAMP.tar.gz"

cd "$BACKUP_DIR"
tar -czf "$ARCHIVE_FILE" \
  "database-dump-$TIMESTAMP.sql" \
  "uploads-$TIMESTAMP" \
  "config-$TIMESTAMP" 2>/dev/null

if [ -f "$ARCHIVE_FILE" ]; then
  size=$(ls -lh "$ARCHIVE_FILE" | awk '{print $5}')
  echo "✅ Archivio creato: $ARCHIVE_FILE ($size)"
else
  echo "❌ Errore nella creazione archivio"
fi

# 5. CREA FILE README
echo ""
echo "5️⃣ Creando istruzioni di ripristino..."

cat > "$BACKUP_DIR/README-RIPRISTINO.txt" << EOF
ISTRUZIONI PER RIPRISTINARE IL BACKUP
=====================================

Data backup: $(date)
Directory: $BACKUP_DIR

CONTENUTO DEL BACKUP:
--------------------
1. database-dump-$TIMESTAMP.sql - Dump completo database PostgreSQL
2. uploads-$TIMESTAMP/ - Tutti i file caricati
3. config-$TIMESTAMP/ - File di configurazione
4. BACKUP-COMPLETO-$TIMESTAMP.tar.gz - Archivio compresso di tutto

COME RIPRISTINARE:
-----------------

1. RIPRISTINO DATABASE:
   psql "postgresql://postgres:postgres@localhost:5432/richiesta_assistenza" < database-dump-$TIMESTAMP.sql

2. RIPRISTINO FILE:
   cp -r uploads-$TIMESTAMP/* /path/to/richiesta-assistenza/uploads/

3. RIPRISTINO CONFIG:
   cp config-$TIMESTAMP/.env /path/to/richiesta-assistenza/
   cp config-$TIMESTAMP/backend.env /path/to/richiesta-assistenza/backend/.env

IMPORTANTE:
----------
- Fare SEMPRE un backup del sistema attuale prima di ripristinare
- Verificare che PostgreSQL sia in esecuzione
- Controllare i permessi dei file dopo il ripristino

EOF

echo "✅ Istruzioni salvate in: $BACKUP_DIR/README-RIPRISTINO.txt"

# 6. REPORT FINALE
echo ""
echo "========================================="
echo "✅ BACKUP COMPLETATO CON SUCCESSO!"
echo "========================================="
echo ""
echo "📁 POSIZIONE BACKUP:"
echo "   $BACKUP_DIR"
echo ""
echo "📊 FILE CREATI:"
ls -lah "$BACKUP_DIR" | grep "$TIMESTAMP"
echo ""
echo "🔒 SICUREZZA:"
echo "   • Database: Dump completo SQL"
echo "   • Files: Copia integrale uploads"
echo "   • Config: File di configurazione salvati"
echo "   • Archivio: Tutto compresso in TAR.GZ"
echo ""
echo "⚠️ IMPORTANTE:"
echo "   1. COPIA questo backup su un disco esterno!"
echo "   2. TESTA il ripristino su un ambiente di test!"
echo "   3. CONSERVA multiple copie in luoghi diversi!"
echo ""
echo "✅ Il tuo sistema è ora al sicuro!"
