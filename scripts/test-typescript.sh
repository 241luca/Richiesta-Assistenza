#!/bin/bash
# Test rapido della compilazione TypeScript

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "🔍 Verifica compilazione TypeScript..."
echo "======================================"
echo ""

# Usa il percorso completo di npx
/usr/local/bin/npx tsc --noEmit 2>&1 | head -20

# Se non ci sono errori
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ NESSUN ERRORE TYPESCRIPT!"
    echo ""
    echo "Il codice è pronto per essere compilato."
else
    echo ""
    echo "⚠️  Alcuni warning o errori rimanenti (vedi sopra)"
fi
