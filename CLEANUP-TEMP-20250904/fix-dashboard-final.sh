#!/bin/bash

echo "🔧 FIX DEFINITIVO DASHBOARD CON NOMI CORRETTI"
echo "============================================="

cd backend

# Fix user-dashboard.routes.ts con i nomi che FUNZIONANO
echo "Correzione user-dashboard.routes.ts..."

# Sostituisci i nomi sbagliati con quelli giusti
sed -i '' 's/professional:/User_AssistanceRequest_professionalIdToUser:/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/client:/User_AssistanceRequest_clientIdToUser:/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/category:/Category:/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/subcategory:/Subcategory:/g' src/routes/dashboard/user-dashboard.routes.ts

# Correggi anche l'accesso ai dati
sed -i '' 's/\.professional\./\.User_AssistanceRequest_professionalIdToUser\./g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/\.professional\?/\.User_AssistanceRequest_professionalIdToUser\?/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/\.client\./\.User_AssistanceRequest_clientIdToUser\./g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/\.client\?/\.User_AssistanceRequest_clientIdToUser\?/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/\.category\./\.Category\./g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/\.category\?/\.Category\?/g' src/routes/dashboard/user-dashboard.routes.ts

echo "✅ user-dashboard.routes.ts corretto"

# Fix admin-dashboard.routes.ts se esiste
if [ -f src/routes/dashboard/admin-dashboard.routes.ts ]; then
    echo "Correzione admin-dashboard.routes.ts..."
    
    sed -i '' 's/professional:/User_AssistanceRequest_professionalIdToUser:/g' src/routes/dashboard/admin-dashboard.routes.ts
    sed -i '' 's/client:/User_AssistanceRequest_clientIdToUser:/g' src/routes/dashboard/admin-dashboard.routes.ts
    sed -i '' 's/category:/Category:/g' src/routes/dashboard/admin-dashboard.routes.ts
    sed -i '' 's/subcategory:/Subcategory:/g' src/routes/dashboard/admin-dashboard.routes.ts
    
    echo "✅ admin-dashboard.routes.ts corretto"
fi

# Fix anche AssistanceRequest -> assistanceRequest nelle query Quote
sed -i '' 's/AssistanceRequest:/assistanceRequest:/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/\.AssistanceRequest\./\.assistanceRequest\./g' src/routes/dashboard/user-dashboard.routes.ts

echo ""
echo "============================================="
echo "✅ DASHBOARD SISTEMATE!"
echo ""
echo "I nomi corretti sono:"
echo "- User_AssistanceRequest_clientIdToUser (per client)"
echo "- User_AssistanceRequest_professionalIdToUser (per professional)"
echo "- Category (con C maiuscola)"
echo "- Subcategory (con S maiuscola)"
echo ""
echo "⚠️ RIAVVIA IL BACKEND e le dashboard dovrebbero funzionare!"
