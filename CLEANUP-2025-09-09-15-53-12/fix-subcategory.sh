#!/bin/bash

# 🔧 FIX RIFERIMENTI SOTTOCATEGORIE
echo "🚀 FIX RIFERIMENTI SOTTOCATEGORIE"
echo "================================="

BACKEND_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend"

echo "🔧 Applicazione fix per subcategory..."

# Fix tutti i riferimenti sbagliati nel file subcategory.service.ts
find "$BACKEND_DIR/src/services" -name "subcategory.service.ts" -exec sed -i '' \
  -e 's/SubcategoryAiSettings/aiSettings/g' \
  -e 's/ProfessionalUsersubcategory/professionalUserSubcategories/g' \
  -e 's/request: true/requests: true/g' \
  -e 's/user:/professional:/g' \
  {} \;

# Fix anche nei routes
find "$BACKEND_DIR/src/routes" -name "subcategory.routes.ts" -exec sed -i '' \
  -e 's/SubcategoryAiSettings/aiSettings/g' \
  -e 's/ProfessionalUsersubcategory/professionalUserSubcategories/g' \
  {} \;

echo ""
echo "📊 VERIFICA:"
echo -n "SubcategoryAiSettings rimasti: "
grep -r "SubcategoryAiSettings" "$BACKEND_DIR/src" --include="*.ts" | wc -l
echo -n "ProfessionalUsersubcategory rimasti: "
grep -r "ProfessionalUsersubcategory" "$BACKEND_DIR/src" --include="*.ts" | wc -l

echo ""
echo "✅ Fix completato!"
