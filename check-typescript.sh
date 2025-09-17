#!/bin/bash

echo "🔍 Verifica TypeScript per request.service.ts..."
echo "================================================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend

# Conta il numero di errori prima della correzione
echo "📊 Analisi errori TypeScript nel file request.service.ts:"
echo ""

# Esegui la compilazione TypeScript
npx tsc --noEmit src/services/request.service.ts 2>&1 | tee /tmp/tsc-output.txt

# Conta gli errori
ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-output.txt 2>/dev/null || echo "0")

echo ""
echo "================================================"
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "✅ SUCCESSO! Nessun errore TypeScript trovato!"
else
    echo "⚠️ Trovati $ERROR_COUNT errori TypeScript"
    echo ""
    echo "Primi 10 errori:"
    grep "error TS" /tmp/tsc-output.txt | head -10
fi
echo "================================================"
