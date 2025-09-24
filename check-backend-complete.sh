#!/bin/bash

echo "🔍 ANALISI COMPLETA SISTEMA BACKEND"
echo "===================================="
echo ""

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# 1. Check TypeScript
echo "📝 1. VERIFICA TYPESCRIPT"
echo "-------------------------"
npx tsc --noEmit 2>&1 | head -20
TSC_EXIT_CODE=$?
if [ $TSC_EXIT_CODE -eq 0 ]; then
  echo "✅ Nessun errore TypeScript!"
else
  echo "⚠️ Ci sono errori TypeScript da correggere"
fi
echo ""

# 2. Verifica ResponseFormatter
echo "📋 2. VERIFICA RESPONSEFORMATTER"
echo "--------------------------------"
echo "Cercando utilizzi diretti di res.json() senza ResponseFormatter..."
DIRECT_RES=$(grep -r "res\.json(" src/routes --include="*.ts" | grep -v "ResponseFormatter" | grep -v "//" | wc -l)
echo "Trovati $DIRECT_RES utilizzi di res.json() senza ResponseFormatter"

if [ $DIRECT_RES -gt 0 ]; then
  echo ""
  echo "⚠️ File con res.json() senza ResponseFormatter:"
  grep -r "res\.json(" src/routes --include="*.ts" | grep -v "ResponseFormatter" | grep -v "//" | head -5
fi
echo ""

# 3. Lista endpoints implementati
echo "📡 3. ENDPOINTS IMPLEMENTATI"
echo "----------------------------"
echo "Conteggio per file:"
for file in src/routes/**/*.ts src/routes/*.ts; do
  if [ -f "$file" ]; then
    COUNT=$(grep -c "router\.\(get\|post\|put\|delete\|patch\)" "$file" 2>/dev/null || echo 0)
    if [ $COUNT -gt 0 ]; then
      echo "  $(basename $file): $COUNT endpoints"
    fi
  fi
done
echo ""

# 4. Verifica import mancanti
echo "🔗 4. VERIFICA IMPORT"
echo "---------------------"
MISSING_IMPORTS=$(grep -r "Cannot find module" src 2>/dev/null | wc -l)
if [ $MISSING_IMPORTS -eq 0 ]; then
  echo "✅ Tutti gli import sono corretti"
else
  echo "⚠️ Trovati $MISSING_IMPORTS import mancanti"
fi
echo ""

# 5. File legal routes
echo "📜 5. SISTEMA DOCUMENTI LEGALI"
echo "-------------------------------"
if [ -f "src/routes/admin/legal-documents.routes.ts" ]; then
  LEGAL_ENDPOINTS=$(grep -c "router\.\(get\|post\|put\|delete\)" src/routes/admin/legal-documents.routes.ts)
  echo "✅ legal-documents.routes.ts: $LEGAL_ENDPOINTS endpoints"
else
  echo "⚠️ legal-documents.routes.ts non trovato"
fi

if [ -f "src/routes/legal.routes.ts" ]; then
  PUBLIC_LEGAL=$(grep -c "router\.\(get\|post\|put\|delete\)" src/routes/legal.routes.ts)
  echo "✅ legal.routes.ts: $PUBLIC_LEGAL endpoints pubblici"
else
  echo "⚠️ legal.routes.ts non trovato"
fi
echo ""

# 6. Riepilogo finale
echo "📊 RIEPILOGO FINALE"
echo "-------------------"
TOTAL_ROUTES=$(find src/routes -name "*.ts" | wc -l)
TOTAL_ENDPOINTS=$(grep -r "router\.\(get\|post\|put\|delete\|patch\)" src/routes --include="*.ts" | wc -l)
echo "• File di route totali: $TOTAL_ROUTES"
echo "• Endpoints totali: $TOTAL_ENDPOINTS"
echo "• TypeScript status: $([ $TSC_EXIT_CODE -eq 0 ] && echo '✅ OK' || echo '⚠️ Da fixare')"
echo "• ResponseFormatter: $([ $DIRECT_RES -eq 0 ] && echo '✅ OK' || echo "⚠️ $DIRECT_RES da fixare")"
echo ""

echo "===================================="
echo "Analisi completata!"
