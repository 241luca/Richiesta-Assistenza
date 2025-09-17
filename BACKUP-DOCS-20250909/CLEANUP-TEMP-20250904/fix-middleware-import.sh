#!/bin/bash

echo "🔧 FIX IMPORT PATH IN TRAVELCOSTROUTES"
echo "====================================="

cd backend

echo "1. Correggo il percorso dell'import:"
sed -i '' "s|'../middlewares/auth'|'../middleware/auth'|g" src/routes/travelCostRoutes.ts
echo "✅ Corretto: middlewares -> middleware"

echo ""
echo "2. Verifica altri import errati nel file:"
grep -n "middlewares" src/routes/travelCostRoutes.ts || echo "✅ Nessun altro import errato"

echo ""
echo "3. Verifica che il file middleware/auth esista:"
if [ -f "src/middleware/auth.ts" ]; then
  echo "✅ src/middleware/auth.ts esiste"
else
  echo "❌ src/middleware/auth.ts non trovato!"
  ls -la src/middleware/ | head -10
fi

echo ""
echo "====================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "L'errore di import dovrebbe essere risolto"
