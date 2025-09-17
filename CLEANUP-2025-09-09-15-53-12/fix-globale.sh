#!/bin/bash

# 🔧 FIX GLOBALE PER TUTTE LE RELAZIONI SBAGLIATE
echo "🚀 FIX GLOBALE RELAZIONI PRISMA"
echo "================================"

BACKEND_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend"

echo "🔧 Applicazione fix globali..."

# Fix in TUTTI i file TypeScript del backend
find "$BACKEND_DIR/src" -type f -name "*.ts" -exec sed -i '' \
  -e 's/Profession: true/professionData: true/g' \
  -e 's/Profession: {/professionData: {/g' \
  -e 's/RequestAttachment: true/attachments: true/g' \
  -e 's/RequestAttachment: {/attachments: {/g' \
  -e 's/\.Profession\b/.professionData/g' \
  -e 's/\.RequestAttachment\b/.attachments/g' \
  -e 's/\["Profession"\]/["professionData"]/g' \
  -e 's/\["RequestAttachment"\]/["attachments"]/g' \
  {} \;

echo "✅ Fix completato!"

# Verifica
echo ""
echo "📊 VERIFICA:"
echo -n "Profession ancora presenti: "
grep -r "Profession:" "$BACKEND_DIR/src" --include="*.ts" | wc -l
echo -n "RequestAttachment ancora presenti: "
grep -r "RequestAttachment:" "$BACKEND_DIR/src" --include="*.ts" | wc -l

echo ""
echo "✅ Fatto!"
