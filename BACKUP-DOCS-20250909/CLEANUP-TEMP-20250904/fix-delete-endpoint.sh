#!/bin/bash

echo "🔧 FIX ENDPOINT DELETE API KEYS"
echo "==============================="

cd backend

echo "1. Rimuovo il codice duplicato dopo export:"
# Rimuovi tutto dopo "export default router;" nel file
sed -i '' '/^export default router;/q' src/routes/apiKeys.routes.ts

echo "✅ Codice duplicato rimosso"

echo ""
echo "2. Verifico che ci sia un solo endpoint DELETE:"
grep -n "router.delete" src/routes/apiKeys.routes.ts

echo ""
echo "3. Test che il server compili ancora:"
npx tsc --noEmit src/routes/apiKeys.routes.ts 2>&1 | head -5

echo ""
echo "==============================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ora l'endpoint DELETE dovrebbe funzionare"
echo "Il frontend manda il SERVICE (es: GOOGLE_MAPS) non l'ID"
