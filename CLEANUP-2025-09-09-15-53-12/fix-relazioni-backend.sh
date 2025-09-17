#!/bin/bash

# 🔧 FIX MIRATO PER I NOMI DELLE RELAZIONI PRISMA
echo "🚀 FIX RELAZIONI PRISMA NEL BACKEND"
echo "===================================="

BACKEND_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend"

# Conteggio prima del fix
echo "📊 PRIMA DEL FIX:"
echo -n "User_AssistanceRequest_clientIdToUser: "
grep -r "User_AssistanceRequest_clientIdToUser" "$BACKEND_DIR/src" --include="*.ts" | wc -l
echo -n "User_AssistanceRequest_professionalIdToUser: "
grep -r "User_AssistanceRequest_professionalIdToUser" "$BACKEND_DIR/src" --include="*.ts" | wc -l

# Fix delle relazioni principali
echo ""
echo "🔧 APPLICAZIONE FIX..."

find "$BACKEND_DIR/src" -type f -name "*.ts" -exec sed -i '' \
  -e 's/User_AssistanceRequest_clientIdToUser/client/g' \
  -e 's/User_AssistanceRequest_professionalIdToUser/professional/g' \
  -e 's/User_AssistanceRequest_assignedByToUser/assignedByUser/g' \
  -e 's/User_InterventionReport_clientIdToUser/client/g' \
  -e 's/User_InterventionReport_professionalIdToUser/professional/g' \
  -e 's/User_InterventionReportTemplate_approvedByToUser/approvedByUser/g' \
  -e 's/User_InterventionReportTemplate_createdByToUser/createdByUser/g' \
  -e 's/User_Message_recipientIdToUser/recipient/g' \
  -e 's/User_Message_senderIdToUser/sender/g' \
  -e 's/User_Notification_recipientIdToUser/recipient/g' \
  -e 's/User_Notification_senderIdToUser/sender/g' \
  -e 's/User_ScheduledIntervention_createdByToUser/createdByUser/g' \
  -e 's/User_ScheduledIntervention_professionalIdToUser/professional/g' \
  {} \;

# Fix per Category -> category e simili (solo in include/select)
echo "🔧 Fix maiuscole/minuscole nelle relazioni..."
find "$BACKEND_DIR/src" -type f -name "*.ts" -exec sed -i '' \
  -e 's/Category: {/category: {/g' \
  -e 's/Subcategory: {/subcategory: {/g' \
  -e 's/User: {/user: {/g' \
  -e 's/AssistanceRequest: {/request: {/g' \
  -e 's/Quote: {/quote: {/g' \
  -e 's/Category: true/category: true/g' \
  -e 's/Subcategory: true/subcategory: true/g' \
  -e 's/User: true/user: true/g' \
  -e 's/AssistanceRequest: true/request: true/g' \
  {} \;

# Conteggio dopo il fix
echo ""
echo "📊 DOPO IL FIX:"
echo -n "User_AssistanceRequest_clientIdToUser: "
grep -r "User_AssistanceRequest_clientIdToUser" "$BACKEND_DIR/src" --include="*.ts" | wc -l
echo -n "Category con maiuscola in include: "
grep -r "Category: {" "$BACKEND_DIR/src" --include="*.ts" | wc -l

echo ""
echo "✅ Fix completato!"
