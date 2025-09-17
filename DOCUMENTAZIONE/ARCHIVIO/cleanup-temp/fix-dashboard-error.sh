#!/bin/bash

echo "🔧 FIX DASHBOARD ROUTE ERROR"
echo "============================"

cd backend

# Crea un backup del file originale
cp src/routes/dashboard/user-dashboard.routes.ts src/routes/dashboard/user-dashboard.routes.ts.backup

# Correggi il problema sostituendo 'client:' con il nome corretto della relazione
sed -i '' 's/client: {/User_AssistanceRequest_clientIdToUser: {/g' src/routes/dashboard/user-dashboard.routes.ts

# Correggi anche 'category:' se necessario
sed -i '' 's/category: {/Category: {/g' src/routes/dashboard/user-dashboard.routes.ts

echo "✅ File corretto!"
echo ""
echo "Verifica le modifiche:"
echo "----------------------"
grep -n "User_AssistanceRequest_clientIdToUser:" src/routes/dashboard/user-dashboard.routes.ts | head -3
echo ""
grep -n "Category:" src/routes/dashboard/user-dashboard.routes.ts | head -3

echo ""
echo "============================"
echo "RIAVVIA IL BACKEND per applicare le modifiche!"
