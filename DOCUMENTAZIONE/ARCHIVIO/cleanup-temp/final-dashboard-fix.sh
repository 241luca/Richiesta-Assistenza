#!/bin/bash

echo "🎯 FIX DEFINITIVO DASHBOARD CON NOMI CORRETTI"
echo "============================================="

cd backend

# Backup
cp src/routes/dashboard/user-dashboard.routes.ts src/routes/dashboard/user-dashboard.routes.ts.backup-final

echo "Correzione user-dashboard.routes.ts con i nomi CORRETTI:"

# Sistemiamo il file con i nomi giusti
sed -i '' 's/professional:/User_AssistanceRequest_professionalIdToUser:/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/client:/User_AssistanceRequest_clientIdToUser:/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/category:/Category:/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/subcategory:/Subcategory:/g' src/routes/dashboard/user-dashboard.routes.ts

# Fix anche l'accesso ai dati
sed -i '' 's/\.professional\./\.User_AssistanceRequest_professionalIdToUser\./g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/\.professional\?/\.User_AssistanceRequest_professionalIdToUser\?/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/\.client\./\.User_AssistanceRequest_clientIdToUser\./g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/\.client\?/\.User_AssistanceRequest_clientIdToUser\?/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/\.category\./\.Category\./g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/\.category\?/\.Category\?/g' src/routes/dashboard/user-dashboard.routes.ts

# Fix per le query sui Quote
sed -i '' 's/AssistanceRequest:/assistanceRequest:/g' src/routes/dashboard/user-dashboard.routes.ts

echo "✅ Dashboard corretta!"

echo ""
echo "============================================="
echo "FATTO! Ora:"
echo "1. Riavvia il backend (Ctrl+C e npm run dev)"
echo "2. Le dashboard dovrebbero funzionare"
echo ""
echo "Se funzionano, applichiamo lo stesso fix alle altre pagine"
