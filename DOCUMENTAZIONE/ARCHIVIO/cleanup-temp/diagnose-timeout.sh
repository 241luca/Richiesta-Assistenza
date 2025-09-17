#!/bin/bash

echo "🔍 DIAGNOSI COMPLETA PROBLEMA TIMEOUT"
echo "===================================="

cd backend

echo "1. Verifica se il nuovo file semplificato è stato creato:"
ls -la src/routes/travelCostRoutes.ts*

echo ""
echo "2. Contenuto attuale del file:"
head -50 src/routes/travelCostRoutes.ts

echo ""
echo "3. Verifica se ResponseFormatter esiste:"
if [ -f "src/utils/responseFormatter.ts" ]; then
  echo "✅ ResponseFormatter.ts esiste"
  echo "Metodi disponibili:"
  grep -E "export.*function|static.*\(" src/utils/responseFormatter.ts | head -10
else
  echo "❌ ResponseFormatter.ts NON ESISTE!"
fi

echo ""
echo "4. Test diretto con curl (se il backend è attivo):"
curl -X GET http://localhost:3200/api/travel/professional/test/cost-settings \
  -H "Content-Type: application/json" \
  --max-time 5 \
  -v 2>&1 | grep -E "< HTTP|Error|timeout"

echo ""
echo "===================================="
echo "Dimmi cosa mostra così possiamo capire"
echo "esattamente dove si blocca"
