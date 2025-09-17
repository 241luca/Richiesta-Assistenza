#!/bin/bash

echo "🔄 RIPRISTINO DAL BACKUP DELLE 18:18"
echo "===================================="

cd backend

# Assumendo che sia questo il backup
BACKUP_DIR="backups/fix-simple-names-20250901-181827"  # Aggiusta con il nome esatto che vedi

if [ -d "$BACKUP_DIR" ]; then
    echo "Ripristino da $BACKUP_DIR..."
    
    # Ripristina tutti i file src
    cp -r "$BACKUP_DIR/src/"* src/
    
    echo "✅ File ripristinati"
    echo ""
    echo "IMPORTANTE:"
    echo "Questo backup usa probabilmente i nomi lunghi:"
    echo "- User_AssistanceRequest_clientIdToUser"
    echo "- User_AssistanceRequest_professionalIdToUser"
    echo "- Category, Subcategory (con maiuscola)"
    echo ""
    echo "Ma almeno FUNZIONAVA!"
else
    echo "❌ Directory non trovata"
    echo "Dimmi il nome esatto del backup che vedi"
fi
