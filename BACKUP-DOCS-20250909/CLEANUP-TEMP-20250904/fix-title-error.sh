#!/bin/bash

echo "🔧 FIX ERRORE TITLE IN USER DASHBOARD"
echo "====================================="

cd backend

echo "Correzione riga 538 in user-dashboard.routes.ts..."

# Fix il problema specifico
sed -i '' 's/quote\.assistanceRequest\.title/quote.AssistanceRequest.title/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/request\.client\?/request.User_AssistanceRequest_clientIdToUser?/g' src/routes/dashboard/user-dashboard.routes.ts

echo "✅ Corretto!"

echo ""
echo "Verifica la correzione:"
grep -n "quote.AssistanceRequest.title" src/routes/dashboard/user-dashboard.routes.ts | head -3

echo ""
echo "====================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ora dovrebbe funzionare anche la user dashboard!"
