#!/bin/bash

echo "🔧 FIX SUBCATEGORY (tutto minuscolo!)"
echo "====================================="

cd backend

echo "Correzione SubCategory -> subcategory:"

# Fix in request.routes.ts
sed -i '' 's/SubCategory/subcategory/g' src/routes/request.routes.ts

# Fix anche in altri file se presente
find src -name "*.ts" -exec sed -i '' 's/SubCategory/subcategory/g' {} \;

echo "✅ Corretto!"

echo ""
echo "Verifica correzione:"
grep -n "subcategory" src/routes/request.routes.ts | head -3

echo ""
echo "====================================="
echo "RIAVVIA IL BACKEND!"
