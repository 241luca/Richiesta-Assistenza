#!/bin/bash

echo "🔄 SPOSTAMENTO BACKUP NELLA POSIZIONE CORRETTA"
echo "=============================================="
echo ""

OLD_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend/backend/backups"
NEW_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend/backups"

echo "1️⃣ Spostamento file esistenti..."
echo ""

# Sposta i file database
if [ -d "$OLD_DIR/database" ]; then
    echo "Spostando backup database..."
    mv $OLD_DIR/database/*.sql.gz $NEW_DIR/database/ 2>/dev/null
    echo "✅ Database backup spostati"
fi

# Sposta i file code
if [ -d "$OLD_DIR/code" ]; then
    echo "Spostando backup codice..."
    mv $OLD_DIR/code/*.tar.gz $NEW_DIR/code/ 2>/dev/null
    echo "✅ Code backup spostati"
fi

# Sposta i file uploads
if [ -d "$OLD_DIR/uploads" ]; then
    echo "Spostando backup uploads..."
    mv $OLD_DIR/uploads/*.tar.gz $NEW_DIR/uploads/ 2>/dev/null
    echo "✅ Uploads backup spostati"
fi

echo ""
echo "2️⃣ Rimozione directory vuote..."
rmdir $OLD_DIR/database 2>/dev/null
rmdir $OLD_DIR/code 2>/dev/null
rmdir $OLD_DIR/uploads 2>/dev/null
rmdir $OLD_DIR 2>/dev/null
rmdir /Users/lucamambelli/Desktop/richiesta-assistenza/backend/backend 2>/dev/null

echo ""
echo "3️⃣ Verifica spostamento..."
echo ""
echo "Backup nella nuova posizione:"
ls -la $NEW_DIR/database/*.sql.gz 2>/dev/null | tail -5
ls -la $NEW_DIR/code/*.tar.gz 2>/dev/null | tail -5
ls -la $NEW_DIR/uploads/*.tar.gz 2>/dev/null | tail -5

echo ""
echo "=============================================="
echo "✅ BACKUP SPOSTATI NELLA POSIZIONE CORRETTA!"
echo ""
echo "Path corretto: backend/backups/"
echo "Il service ora salverà nel posto giusto."
