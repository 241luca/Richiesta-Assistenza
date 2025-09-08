#!/bin/bash

echo "🔧 FIX SUBCATEGORY (con S maiuscola!)"
echo "===================================="

cd backend

echo "Correzione subCategory -> Subcategory..."

# Fix in request.routes.ts
sed -i '' 's/subCategory: true/Subcategory: true/g' src/routes/request.routes.ts

# Fix in quote.routes.ts
sed -i '' 's/subCategory: true/Subcategory: true/g' src/routes/quote.routes.ts

# Cerca e correggi in tutti i file
find src -type f -name "*.ts" -exec sed -i '' 's/subCategory/Subcategory/g' {} \;

echo "✅ Corretto!"

echo ""
echo "Verifica correzioni:"
grep -n "Subcategory: true" src/routes/request.routes.ts | head -2
grep -n "Subcategory: true" src/routes/quote.routes.ts | head -2

echo ""
echo "===================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ricorda: è Subcategory NON subCategory!"
