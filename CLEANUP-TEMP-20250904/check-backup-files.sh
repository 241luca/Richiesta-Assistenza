#!/bin/bash

echo "🔍 VERIFICA CONTENUTO BACKUP"
echo "============================"
echo ""

# Trova tutti i file di backup nel sistema
echo "1️⃣ Cercando file di backup .sql.gz nel progetto..."
find /Users/lucamambelli/Desktop/richiesta-assistenza -name "*.sql.gz" -type f 2>/dev/null | head -20

echo ""
echo "2️⃣ Cercando file di backup .tar.gz nel progetto..."
find /Users/lucamambelli/Desktop/richiesta-assistenza -name "*.tar.gz" -type f 2>/dev/null | head -20

echo ""
echo "3️⃣ Contenuto directory backend/backups/..."
ls -la /Users/lucamambelli/Desktop/richiesta-assistenza/backend/backups/database/ 2>/dev/null
echo "---"
ls -la /Users/lucamambelli/Desktop/richiesta-assistenza/backend/backups/code/ 2>/dev/null
echo "---"
ls -la /Users/lucamambelli/Desktop/richiesta-assistenza/backend/backups/uploads/ 2>/dev/null

echo ""
echo "4️⃣ Verifica path doppio backend/backend..."
if [ -d "/Users/lucamambelli/Desktop/richiesta-assistenza/backend/backend/backups" ]; then
    echo "⚠️ TROVATA directory backend/backend/backups!"
    ls -la /Users/lucamambelli/Desktop/richiesta-assistenza/backend/backend/backups/database/ 2>/dev/null
else
    echo "✅ Non esiste backend/backend/backups"
fi

echo ""
echo "============================"
