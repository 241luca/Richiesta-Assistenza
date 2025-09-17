#!/bin/bash

echo "📦 VERIFICA CONTENUTO DEI BACKUP"
echo "================================"
echo ""

BACKUP_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend/backend/backups"

echo "✅ BACKUP TROVATI:"
echo "=================="
echo ""

# 1. Database backup
echo "1️⃣ DATABASE BACKUP:"
DB_FILE=$(ls -t $BACKUP_DIR/database/*.sql.gz 2>/dev/null | head -1)
if [ -f "$DB_FILE" ]; then
    echo "   File: $(basename $DB_FILE)"
    echo "   Size: $(du -h $DB_FILE | cut -f1)"
    echo "   Contenuto (prime 5 righe):"
    gunzip -c "$DB_FILE" 2>/dev/null | head -5 | sed 's/^/   /'
    echo "   ..."
    echo "   Tabelle nel backup:"
    gunzip -c "$DB_FILE" 2>/dev/null | grep "CREATE TABLE" | head -10 | sed 's/^/   /'
else
    echo "   ❌ Nessun backup database trovato"
fi

echo ""
echo "2️⃣ CODE BACKUP:"
CODE_FILE=$(ls -t $BACKUP_DIR/code/*.tar.gz 2>/dev/null | head -1)
if [ -f "$CODE_FILE" ]; then
    echo "   File: $(basename $CODE_FILE)"
    echo "   Size: $(du -h $CODE_FILE | cut -f1)"
    echo "   Contenuto (primi 20 file):"
    tar -tzf "$CODE_FILE" 2>/dev/null | head -20 | sed 's/^/   /'
    echo "   ..."
    echo "   Totale file nel backup: $(tar -tzf "$CODE_FILE" 2>/dev/null | wc -l)"
else
    echo "   ❌ Nessun backup codice trovato"
fi

echo ""
echo "3️⃣ UPLOADS BACKUP:"
UPLOADS_FILE=$(ls -t $BACKUP_DIR/uploads/*.tar.gz 2>/dev/null | head -1)
if [ -f "$UPLOADS_FILE" ]; then
    echo "   File: $(basename $UPLOADS_FILE)"
    echo "   Size: $(du -h $UPLOADS_FILE | cut -f1)"
    echo "   Contenuto:"
    tar -tzf "$UPLOADS_FILE" 2>/dev/null | sed 's/^/   /'
else
    echo "   ❌ Nessun backup uploads trovato"
fi

echo ""
echo "================================"
echo "📍 PATH ATTUALE DEI BACKUP:"
echo "   $BACKUP_DIR"
echo ""
echo "⚠️ NOTA: Il path ha 'backend' duplicato."
echo "   Dovrebbe essere: backend/backups/"
echo "   Attualmente è: backend/backend/backups/"
echo ""
echo "Questo va corretto nel service!"
