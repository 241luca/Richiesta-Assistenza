#!/bin/bash

# 🔧 FIX DEFINITIVO PER TUTTI I NOMI DELLE RELAZIONI
echo "🚀 FIX DEFINITIVO RELAZIONI PRISMA"
echo "=================================="

BACKEND_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend"

echo "📊 CONTEGGIO ERRORI PRIMA DEL FIX:"
echo "================================="
echo -n "QuoteItem: "
grep -r "QuoteItem:" "$BACKEND_DIR/src" --include="*.ts" | wc -l
echo -n "profession (non professionData): "
grep -r "profession:" "$BACKEND_DIR/src" --include="*.ts" | grep -v "professionData:" | wc -l

echo ""
echo "🔧 APPLICAZIONE FIX IN CORSO..."
echo "================================"

# Lista completa di sostituzioni da fare
find "$BACKEND_DIR/src" -type f -name "*.ts" -exec sed -i '' \
  -e 's/QuoteItem:/items:/g' \
  -e 's/QuoteItem: true/items: true/g' \
  -e 's/\.QuoteItem\b/.items/g' \
  -e 's/\["QuoteItem"\]/["items"]/g' \
  -e 's/profession: true/professionData: true/g' \
  -e 's/Professional:/professional:/g' \
  -e 's/Creator:/createdByUser:/g' \
  -e 's/\.Professional\b/.professional/g' \
  -e 's/\.Creator\b/.createdByUser/g' \
  {} \;

echo ""
echo "📊 VERIFICA DOPO IL FIX:"
echo "======================="
echo -n "QuoteItem rimasti: "
grep -r "QuoteItem:" "$BACKEND_DIR/src" --include="*.ts" | wc -l
echo -n "profession rimasti (non professionData): "
grep -r "profession:" "$BACKEND_DIR/src" --include="*.ts" | grep -v "professionData:" | wc -l

echo ""
echo "✅ Fix completato!"
echo ""
echo "🔍 SUGGERIMENTO: Se ci sono ancora errori, esegui:"
echo "grep -r 'Unknown field' $BACKEND_DIR/logs/*.log | tail -20"
