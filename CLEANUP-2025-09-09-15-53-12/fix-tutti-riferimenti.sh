#!/bin/bash

# 🔧 FIX FINALE COMPLETO PER TUTTI I RIFERIMENTI RIMASTI
echo "🚀 FIX FINALE COMPLETO"
echo "====================="

BACKEND_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend"

echo "📊 ERRORI RIMANENTI PRIMA DEL FIX:"
echo "================================="
echo -n "QuoteItem ancora presenti: "
grep -r "QuoteItem" "$BACKEND_DIR/src" --include="*.ts" | wc -l

echo ""
echo "🔧 APPLICAZIONE FIX FINALE..."
echo "============================="

# Fix tutti i riferimenti QuoteItem rimasti
find "$BACKEND_DIR/src" -type f -name "*.ts" -exec sed -i '' \
  -e 's/QuoteItem/items/g' \
  -e 's/\.items\b/.items/g' \
  {} \;

# Fix user vs users nel _count
find "$BACKEND_DIR/src" -type f -name "*.ts" -exec sed -i '' \
  -e 's/user: true,/users: true,/g' \
  {} \;

echo ""
echo "📊 VERIFICA DOPO IL FIX:"
echo "========================"
echo -n "QuoteItem rimasti: "
grep -r "QuoteItem" "$BACKEND_DIR/src" --include="*.ts" | wc -l

echo ""
echo "✅ Fix finale completato!"
echo ""
echo "Se ci sono ancora errori, controlla:"
echo "tail -100 $BACKEND_DIR/logs/error.log | grep 'Unknown field'"
