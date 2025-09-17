#!/bin/bash

echo "🔍 RICERCA CHIAMATE GEOCODE NEL FRONTEND"
echo "========================================"

# Cerca in tutti i file TypeScript e JavaScript
echo "Cercando chiamate a geocode..."
grep -r "geocode" src/ --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" 2>/dev/null | head -20

echo ""
echo "========================================"
echo "Cercando componenti mappa..."
grep -r -i "map" src/components --include="*.tsx" --include="*.ts" | grep -i "component\|function\|export" | head -20

echo ""
echo "========================================"
echo "Cercando nella pagina RequestDetail..."
grep -n -i "map\|geocode" src/pages/RequestDetailPage.tsx 2>/dev/null | head -20
