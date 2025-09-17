#!/bin/bash

echo "🔧 FIX ACCESSO PROPRIETÀ request"
echo "================================"

cd backend

echo "1. Fix admin dashboard (riga 176):"
sed -i '' 's/AssistanceRequest\.title/request?.title/g' src/routes/admin/dashboard.routes.ts
echo "✅ admin/dashboard.routes.ts"

echo ""
echo "2. Fix user dashboard (riga 538):"
sed -i '' 's/AssistanceRequest\.title/request?.title/g' src/routes/dashboard/user-dashboard.routes.ts
echo "✅ dashboard/user-dashboard.routes.ts"

echo ""
echo "3. Cerca altri accessi a AssistanceRequest:"
grep -n "AssistanceRequest\." src/routes/admin/dashboard.routes.ts | head -5
grep -n "AssistanceRequest\." src/routes/dashboard/user-dashboard.routes.ts | head -5

echo ""
echo "4. Fix generale AssistanceRequest. -> request.:"
find src/routes -name "*.ts" -exec sed -i '' 's/AssistanceRequest\./request\./g' {} \;
echo "✅ Tutti i file corretti"

echo ""
echo "================================"
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Le dashboard ora dovrebbero funzionare!"
