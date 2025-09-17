#!/bin/bash

# Script per correggere l'uso di apiClient con api nei file del progetto
# Data: 02 Settembre 2025

echo "🔧 Correzione uso apiClient -> api nei componenti..."

BACKUP_DIR="backup-apiClient-fix-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Lista dei file critici da correggere
FILES=(
  "src/components/ai/AiChatComplete.tsx"
  "src/components/chat/RequestChat.tsx"
  "src/components/quotes/QuoteBuilder.tsx"
  "src/components/address/AddressGeocoding.tsx"
  "src/components/professional/ProfessionalAiSettings.tsx"
  "src/components/professional/ProfessionalSubcategoriesManager.tsx"
  "src/components/travel/AutoTravelInfo.tsx"
  "src/components/travel/TravelCostDisplay.tsx"
  "src/components/travel/TravelCostSettings.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📄 Processando: $file"
    
    # Backup del file
    cp "$file" "$BACKUP_DIR/$(basename $file).backup"
    
    # Correzioni:
    # 1. Cambia "import { apiClient }" in "import { api }"
    sed -i '' "s/import { apiClient }/import { api }/g" "$file"
    
    # 2. Cambia "import { apiClient as api }" in "import { api }"
    sed -i '' "s/import { apiClient as api }/import { api }/g" "$file"
    
    # 3. Cambia "apiClient." in "api." nelle chiamate
    sed -i '' "s/apiClient\./api\./g" "$file"
    
    # 4. Se c'è ancora "apiClient" da solo (non seguito da .), cambialo in "api"
    sed -i '' "s/\bapiClient\b/api/g" "$file"
    
    echo "✅ $file corretto"
  else
    echo "⚠️ File non trovato: $file"
  fi
done

# Conta quanti file sono stati modificati
MODIFIED_COUNT=$(ls -1 "$BACKUP_DIR" | wc -l)
echo ""
echo "✅ Correzione completata!"
echo "📁 Backup salvati in: $BACKUP_DIR"
echo "📊 File modificati: $MODIFIED_COUNT"
echo ""
echo "🔍 Verifica delle importazioni corrette:"
grep -h "import.*api.*from.*services/api" src/components/ai/AiChatComplete.tsx src/components/chat/RequestChat.tsx src/components/quotes/QuoteBuilder.tsx 2>/dev/null | head -5
