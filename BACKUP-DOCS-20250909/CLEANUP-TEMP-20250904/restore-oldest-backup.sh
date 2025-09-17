#!/bin/bash

echo "🔄 RIPRISTINO DAL BACKUP PIÙ VECCHIO (prima di tutti i casini)"
echo "============================================================="

cd backend

# Il backup più vecchio dovrebbe essere il più "pulito"
BACKUP_DIR="backups/20250901-172922"

if [ -d "$BACKUP_DIR" ]; then
    echo "Ripristino da $BACKUP_DIR (il più vecchio, delle 17:29)..."
    
    # Backup di sicurezza prima di ripristinare
    echo "Faccio un backup di sicurezza dell'attuale..."
    mkdir -p backups/before-restore-$(date +%Y%m%d-%H%M%S)
    cp -r src backups/before-restore-$(date +%Y%m%d-%H%M%S)/
    
    # Ripristina tutti i file src
    echo "Ripristino i file..."
    cp -r "$BACKUP_DIR/src/"* src/
    
    echo "✅ File ripristinati dal backup delle 17:29"
    echo ""
    echo "Questo backup dovrebbe avere:"
    echo "- I nomi lunghi brutti ma FUNZIONANTI"
    echo "- Tutto il codice prima dei nostri tentativi di fix"
    echo ""
    echo "RIAVVIA IL BACKEND e prova se funziona!"
else
    echo "❌ Backup non trovato!"
fi
