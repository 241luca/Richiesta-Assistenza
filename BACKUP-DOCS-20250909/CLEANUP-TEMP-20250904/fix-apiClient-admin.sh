#!/bin/bash

# Script per correggere l'uso di apiClient nelle pagine admin
# Data: 02 Settembre 2025

echo "🔧 Correzione uso apiClient -> api nelle pagine admin..."

BACKUP_DIR="backup-apiClient-admin-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Lista delle pagine admin da correggere
FILES=(
  "src/pages/admin/AiManagement.tsx"
  "src/pages/admin/CategoriesPage.tsx"
  "src/pages/admin/SubcategoriesPage.tsx"
  "src/pages/admin/SystemSettingsPage.tsx"
  "src/pages/admin/ProfessionalsList.tsx"
  "src/pages/admin/api-keys/GoogleMapsConfig.tsx"
  "src/pages/admin/api-keys/OpenAIConfig.tsx"
  "src/pages/admin/api-keys/BrevoConfig.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📄 Processando: $file"
    
    # Backup del file
    cp "$file" "$BACKUP_DIR/$(basename $file).backup"
    
    # Correzioni specifiche per import
    # Cambia qualsiasi variante di import apiClient in import api
    sed -i '' "s/import { apiClient }/import { api }/g" "$file"
    sed -i '' "s/import { apiClient as api }/import { api }/g" "$file"
    sed -i '' "s/from '@\/services\/apiClient'/from '@\/services\/api'/g" "$file"
    sed -i '' "s/from '\.\.\/\.\.\/services\/apiClient'/from '\.\.\/\.\.\/services\/api'/g" "$file"
    sed -i '' "s/from '\.\.\/\.\.\/\.\.\/services\/apiClient'/from '\.\.\/\.\.\/\.\.\/services\/api'/g" "$file"
    
    # Cambia l'uso nel codice
    sed -i '' "s/apiClient\./api\./g" "$file"
    
    echo "✅ $file corretto"
  else
    echo "⚠️ File non trovato: $file"
  fi
done

# Correggi anche le pagine principali
echo ""
echo "🔧 Correzione pagine principali..."

MAIN_FILES=(
  "src/pages/RequestDetailPage.tsx"
  "src/pages/RequestsPage.tsx"
  "src/pages/QuotesPage.tsx"
  "src/pages/QuoteDetailPage.tsx"
  "src/pages/EditRequestPage.tsx"
  "src/pages/EditQuotePage.tsx"
  "src/pages/NewQuotePage.tsx"
)

for file in "${MAIN_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📄 Processando: $file"
    
    # Backup
    cp "$file" "$BACKUP_DIR/$(basename $file).backup"
    
    # Correzioni
    sed -i '' "s/import { apiClient }/import { api }/g" "$file"
    sed -i '' "s/import { apiClient as api }/import { api }/g" "$file"
    sed -i '' "s/apiClient\./api\./g" "$file"
    
    echo "✅ $file corretto"
  fi
done

MODIFIED_COUNT=$(ls -1 "$BACKUP_DIR" | wc -l)
echo ""
echo "✅ Correzione completata!"
echo "📁 Backup salvati in: $BACKUP_DIR"
echo "📊 File modificati: $MODIFIED_COUNT"
