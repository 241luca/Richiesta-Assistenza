#!/bin/bash

# 🔧 FIX FINALE ERRORI COMUNI
echo "🚀 FIX FINALE ERRORI TYPESCRIPT"
echo "================================"

BACKEND_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend"

# Fix 1: Sostituisci tutti i vecchi nomi rimasti
echo "📌 Fix relazioni mancate..."
find "$BACKEND_DIR/src" -type f -name "*.ts" -exec sed -i '' \
  -e 's/User_AssistanceRequest_clientIdToUser/client/g' \
  -e 's/User_AssistanceRequest_professionalIdToUser/professional/g' \
  -e 's/AssistanceRequest_AssistanceRequest/assignedRequests/g' \
  -e 's/InterventionReport_InterventionReport/clientReports/g' \
  -e 's/\.AssistanceRequest\b/.request/g' \
  -e "s/'AssistanceRequest'/'request'/g" \
  -e 's/\.User\b/.user/g' \
  -e 's/\.Category\b/.category/g' \
  -e 's/\.Subcategory\b/.subcategory/g' \
  {} \;

# Fix 2: Fix _count properties  
echo "📌 Fix _count properties..."
find "$BACKEND_DIR/src" -type f -name "*.ts" -exec sed -i '' \
  -e 's/\._count\.AssistanceRequest\b/._count.clientRequests/g' \
  -e 's/\._count\.Quote\b/._count.quotes/g' \
  -e 's/\._count\.Payment\b/._count.payments/g' \
  {} \;

echo "✅ Fix finale completato!"
echo ""
echo "Ora esegui:"
echo "cd $BACKEND_DIR && npx tsc --noEmit"
