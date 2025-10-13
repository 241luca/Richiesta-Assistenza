#!/bin/bash

echo "📊 ANALISI ERRORI TYPESCRIPT PER FILE"
echo "======================================"
echo ""

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Esegui tsc e analizza output
npx tsc --noEmit 2>&1 | grep "error TS" | cut -d'(' -f1 | sort | uniq -c | sort -rn | head -20 > /tmp/ts-errors-by-file.txt

echo "Top 20 file con più errori TypeScript:"
echo ""
cat /tmp/ts-errors-by-file.txt

echo ""
echo "💡 TIP: Inizia a sistemare i file in cima alla lista!"
echo ""
echo "📝 Risultati salvati anche in: /tmp/ts-errors-by-file.txt"
