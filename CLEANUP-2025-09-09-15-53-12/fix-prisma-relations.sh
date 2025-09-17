#!/bin/bash

# 🔧 SCRIPT AUTOMATICO PER FIX RELAZIONI PRISMA
# Data: 8 Settembre 2025
# Questo script sostituisce automaticamente tutti i vecchi nomi con i nuovi

echo "🚀 INIZIO FIX AUTOMATICO RELAZIONI PRISMA"
echo "========================================"
echo ""

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Directory del backend
BACKEND_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/backend"
SRC_DIR="/Users/lucamambelli/Desktop/richiesta-assistenza/src"

# Contatori
TOTAL_FILES=0
MODIFIED_FILES=0

echo "📋 MAPPATURA SOSTITUZIONI"
echo "========================="
echo ""

# Array di sostituzioni (vecchio nome -> nuovo nome)
declare -A replacements=(
    # AssistanceRequest relations
    ["User_AssistanceRequest_assignedByToUser"]="assignedByUser"
    ["User_AssistanceRequest_clientIdToUser"]="client"
    ["User_AssistanceRequest_professionalIdToUser"]="professional"
    ["AssistanceRequest"]="request"  # Per alcuni contesti
    
    # InterventionReport relations
    ["User_InterventionReport_clientIdToUser"]="client"
    ["User_InterventionReport_professionalIdToUser"]="professional"
    
    # InterventionReportTemplate relations
    ["User_InterventionReportTemplate_approvedByToUser"]="approvedByUser"
    ["User_InterventionReportTemplate_createdByToUser"]="createdByUser"
    
    # Message relations
    ["User_Message_recipientIdToUser"]="recipient"
    ["User_Message_senderIdToUser"]="sender"
    
    # Notification relations
    ["User_Notification_recipientIdToUser"]="recipient"
    ["User_Notification_senderIdToUser"]="sender"
    
    # ScheduledIntervention relations
    ["User_ScheduledIntervention_createdByToUser"]="createdByUser"
    ["User_ScheduledIntervention_professionalIdToUser"]="professional"
    
    # User model relations (lato opposto)
    ["AssistanceRequest_AssistanceRequest_assignedByToUser"]="assignedRequests"
    ["AssistanceRequest_AssistanceRequest_clientIdToUser"]="clientRequests"
    ["AssistanceRequest_AssistanceRequest_professionalIdToUser"]="professionalRequests"
    ["InterventionReport_InterventionReport_clientIdToUser"]="clientReports"
    ["InterventionReport_InterventionReport_professionalIdToUser"]="professionalReports"
    ["InterventionReportTemplate_InterventionReportTemplate_approvedByToUser"]="approvedTemplates"
    ["InterventionReportTemplate_InterventionReportTemplate_createdByToUser"]="createdTemplates"
    ["Message_Message_recipientIdToUser"]="messagesReceived"
    ["Message_Message_senderIdToUser"]="messagesSent"
    ["Notification_Notification_recipientIdToUser"]="notificationsReceived"
    ["Notification_Notification_senderIdToUser"]="notificationsSent"
    ["ScheduledIntervention_ScheduledIntervention_createdByToUser"]="interventionsCreated"
    ["ScheduledIntervention_ScheduledIntervention_professionalIdToUser"]="professionalInterventions"
    
    # Altri campi comuni da rinominare
    ["BackupSchedule"]="schedule"
    ["SystemBackup"]="systemBackup"
    ["User"]="user"  # Per contesti generici
    ["Category"]="category"
    ["Subcategory"]="subcategory"
    ["SubcategoryAiSettings"]="subcategorySettings"
    ["NotificationTemplate"]="template"
    ["InterventionFieldType"]="fieldType"
    ["InterventionReportTemplate"]="template"
    ["InterventionReportStatus"]="status"
    ["InterventionType"]="type"
    ["KbDocument"]="document"
    ["Quote"]="quote"
    ["Profession"]="professionData"
)

# Funzione per sostituire in un file
fix_file() {
    local file=$1
    local changed=0
    
    # Crea backup temporaneo
    cp "$file" "$file.tmp"
    
    # Applica tutte le sostituzioni
    for old_name in "${!replacements[@]}"; do
        new_name=${replacements[$old_name]}
        
        # Sostituisci solo se trova il pattern
        if grep -q "$old_name" "$file.tmp" 2>/dev/null; then
            # Sostituisci nei contesti Prisma (include, select, etc)
            sed -i '' "s/\b$old_name\b:/$new_name:/g" "$file.tmp"
            sed -i '' "s/\.$old_name\b/.$new_name/g" "$file.tmp"
            sed -i '' "s/\['$old_name'\]/['$new_name']/g" "$file.tmp"
            sed -i '' "s/\"$old_name\"/\"$new_name\"/g" "$file.tmp"
            changed=1
        fi
    done
    
    # Se ci sono stati cambiamenti, salva il file
    if [ $changed -eq 1 ]; then
        mv "$file.tmp" "$file"
        echo -e "${GREEN}✅ Modificato: $file${NC}"
        ((MODIFIED_FILES++))
    else
        rm "$file.tmp"
    fi
    
    ((TOTAL_FILES++))
}

# FASE 1: Fix file TypeScript nel backend
echo ""
echo "📂 FASE 1: Fix Backend TypeScript Files"
echo "======================================="

# Trova tutti i file .ts nel backend
find "$BACKEND_DIR/src" -type f -name "*.ts" | while read file; do
    fix_file "$file"
done

# FASE 2: Fix file TypeScript nel frontend
echo ""
echo "📂 FASE 2: Fix Frontend TypeScript/TSX Files"
echo "============================================="

# Trova tutti i file .ts e .tsx nel frontend
find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
    fix_file "$file"
done

# FASE 3: Sostituzioni specifiche per pattern comuni
echo ""
echo "📂 FASE 3: Fix Pattern Specifici"
echo "================================"

# Fix per include statements
echo "Fixing include statements..."
find "$BACKEND_DIR/src" "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "include:" {} \; | while read file; do
    # Backup
    cp "$file" "$file.bak"
    
    # Fix include patterns specifici
    sed -i '' 's/User_AssistanceRequest_clientIdToUser: true/client: true/g' "$file"
    sed -i '' 's/User_AssistanceRequest_professionalIdToUser: true/professional: true/g' "$file"
    sed -i '' 's/User_InterventionReport_clientIdToUser: true/client: true/g' "$file"
    sed -i '' 's/User_InterventionReport_professionalIdToUser: true/professional: true/g' "$file"
    sed -i '' 's/User_Message_recipientIdToUser: true/recipient: true/g' "$file"
    sed -i '' 's/User_Message_senderIdToUser: true/sender: true/g' "$file"
    sed -i '' 's/User_Notification_recipientIdToUser: true/recipient: true/g' "$file"
    sed -i '' 's/User_Notification_senderIdToUser: true/sender: true/g' "$file"
    
    # Verifica se ci sono cambiamenti
    if ! diff -q "$file" "$file.bak" > /dev/null; then
        echo -e "${GREEN}✅ Fixed includes in: $file${NC}"
        rm "$file.bak"
    else
        rm "$file.bak"
    fi
done

# FASE 4: Report finale
echo ""
echo "========================================"
echo "📊 REPORT FINALE"
echo "========================================"
echo ""
echo "Files analizzati: $TOTAL_FILES"
echo "Files modificati: $MODIFIED_FILES"
echo ""

# FASE 5: Suggerimenti per verifiche manuali
echo "⚠️  VERIFICHE MANUALI CONSIGLIATE:"
echo "===================================="
echo ""
echo "1. Cerca pattern residui:"
echo "   grep -r 'User_' $BACKEND_DIR/src/"
echo "   grep -r 'User_' $SRC_DIR/"
echo ""
echo "2. Verifica TypeScript:"
echo "   cd $BACKEND_DIR && npx tsc --noEmit"
echo ""
echo "3. Files che potrebbero richiedere attenzione manuale:"
find "$BACKEND_DIR/src" "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "User_\|_ToUser" {} \; 2>/dev/null | head -10

echo ""
echo "✅ SCRIPT COMPLETATO!"
echo ""
echo "PROSSIMI PASSI:"
echo "1. Applica il nuovo schema: cp $BACKEND_DIR/prisma/schema-FIXED.prisma $BACKEND_DIR/prisma/schema.prisma"
echo "2. Genera il client Prisma: cd $BACKEND_DIR && npx prisma generate"
echo "3. Verifica TypeScript: cd $BACKEND_DIR && npx tsc --noEmit"
echo "4. Correggi eventuali errori residui manualmente"
