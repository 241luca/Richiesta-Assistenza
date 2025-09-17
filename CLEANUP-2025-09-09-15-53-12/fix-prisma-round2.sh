#!/bin/bash

# 🔧 FIX AGGRESSIVO PER RELAZIONI MANCATE
echo "🚀 FIX AGGRESSIVO RELAZIONI PRISMA - ROUND 2"
echo "==========================================="

BACKEND_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend"
SRC_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/src"

# Fix specifici per i pattern trovati negli errori
echo "📌 Fixing User_AssistanceRequest patterns..."
find "$BACKEND_DIR/src" -type f -name "*.ts" -exec sed -i '' \
  -e 's/User_AssistanceRequest_clientIdToUser/client/g' \
  -e 's/User_AssistanceRequest_professionalIdToUser/professional/g' \
  -e 's/User_AssistanceRequest_assignedByToUser/assignedByUser/g' \
  -e 's/User_InterventionReport_clientIdToUser/client/g' \
  -e 's/User_InterventionReport_professionalIdToUser/professional/g' \
  {} \;

echo "📌 Fixing AssistanceRequest in Quote relations..."
find "$BACKEND_DIR/src" -type f -name "*.ts" -exec sed -i '' \
  -e "s/AssistanceRequest: {/request: {/g" \
  -e "s/AssistanceRequest: true/request: true/g" \
  -e "s/\.AssistanceRequest\b/.request/g" \
  -e "s/\['AssistanceRequest'\]/['request']/g" \
  {} \;

echo "📌 Fixing _count properties..."
find "$BACKEND_DIR/src" -type f -name "*.ts" -exec sed -i '' \
  -e 's/\._count\.AssistanceRequest/._count.clientRequests/g' \
  -e 's/\._count\.Quote/._count.quotes/g' \
  {} \;

echo "✅ Round 2 completato!"
