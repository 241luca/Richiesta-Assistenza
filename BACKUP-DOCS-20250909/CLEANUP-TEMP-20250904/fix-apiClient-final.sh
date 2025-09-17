#!/bin/bash

# Script finale per correggere tutti i riferimenti rimanenti a apiClient
# Data: 02 Settembre 2025

echo "🔧 Correzione finale di tutti i riferimenti apiClient..."

BACKUP_DIR="backup-apiClient-final-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# File specifici che hanno ancora problemi
FILES_TO_FIX=(
  "src/pages/QuotesPage.tsx"
  "src/pages/RequestsPage.tsx"
  "src/pages/admin/SystemEnumsPage.tsx"
  "src/pages/admin/professionals/ai-settings/ProfessionalAiSettings.tsx"
  "src/pages/admin/professionals/competenze/ProfessionalCompetenze.tsx"
  "src/pages/admin/AdminDashboard.tsx"
  "src/pages/admin/SystemSettingsSimplePage.tsx"
  "src/hooks/useGoogleMapsKey.ts"
  "src/contexts/GoogleMapsContext.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📄 Processando: $file"
    
    # Backup
    cp "$file" "$BACKUP_DIR/$(basename $file).backup" 2>/dev/null
    
    # Rimuovi import duplicati o errati
    sed -i '' "s/import { api, apiClient }/import { api }/g" "$file"
    sed -i '' "s/import { apiClient }/import { api }/g" "$file"
    
    # Correggi chiamate dinamiche
    sed -i '' "s/const { apiClient }/const { api }/g" "$file"
    sed -i '' "s/await import('\.\.\/services\/api')/await import('\.\.\/services\/api')/g" "$file"
    
    # Sostituisci tutti gli usi di apiClient con api
    sed -i '' "s/apiClient\./api\./g" "$file"
    
    echo "✅ $file corretto"
  fi
done

# Correggi specificamente SystemEnumsPage
if [ -f "src/pages/admin/SystemEnumsPage.tsx" ]; then
  echo "🔧 Correzione speciale per SystemEnumsPage..."
  cp "src/pages/admin/SystemEnumsPage.tsx" "$BACKUP_DIR/SystemEnumsPage.backup"
  
  # Sostituisci import
  sed -i '' "s/import { apiClient }/import { api }/g" "src/pages/admin/SystemEnumsPage.tsx"
  
  # Sostituisci tutte le occorrenze nel file
  sed -i '' "s/apiClient\./api\./g" "src/pages/admin/SystemEnumsPage.tsx"
  
  echo "✅ SystemEnumsPage corretto"
fi

echo ""
echo "✅ Correzione finale completata!"
echo "📁 Backup salvati in: $BACKUP_DIR"
echo ""
echo "🔍 Verifica finale - File che ancora contengono 'apiClient':"
grep -r "apiClient\." /Users/lucamambelli/Desktop/richiesta-assistenza/src --include="*.tsx" --include="*.ts" | grep -v backup | grep -v "export const apiClient" | wc -l
echo "riferimenti rimasti (dovrebbe essere 0 o molto basso)"
