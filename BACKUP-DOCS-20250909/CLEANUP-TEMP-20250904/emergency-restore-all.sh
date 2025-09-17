#!/bin/bash

echo "🚨 RIPRISTINO EMERGENZA - TORNARE A STATO FUNZIONANTE"
echo "===================================================="

cd backend

# Trova i backup più recenti
echo "📁 Backup disponibili:"
ls -lt backups/ | head -10

echo ""
echo "Opzioni di ripristino:"
echo "1. Ripristinare l'ultimo backup funzionante"
echo "2. Ripristinare lo schema Prisma originale e rigenerare"
echo ""

# Trova il backup dello schema prima di tutte le modifiche
SCHEMA_BACKUP=$(ls -t prisma/schema.prisma.backup-* 2>/dev/null | head -1)

if [ -f "$SCHEMA_BACKUP" ]; then
    echo "Trovato backup schema: $SCHEMA_BACKUP"
    echo ""
    echo "RIPRISTINO IN CORSO..."
    
    # Ripristina lo schema
    cp "$SCHEMA_BACKUP" prisma/schema.prisma
    echo "✅ Schema ripristinato"
    
    # Rigenera Prisma Client
    echo "Rigenerazione Prisma Client..."
    npx prisma generate
    
    # Ripristina anche il codice all'ultimo backup funzionante
    LAST_GOOD_BACKUP="backups/fix-simple-names-20250901-174212"
    if [ -d "$LAST_GOOD_BACKUP" ]; then
        echo "Ripristino codice da $LAST_GOOD_BACKUP..."
        cp -r "$LAST_GOOD_BACKUP/src" .
        echo "✅ Codice ripristinato"
    fi
    
    echo ""
    echo "===================================================="
    echo "✅ RIPRISTINO COMPLETATO!"
    echo ""
    echo "ADESSO:"
    echo "1. Riavvia il backend (Ctrl+C e npm run dev)"
    echo "2. Verifica che funzioni"
    echo "3. NON fare altre modifiche senza testare!"
else
    echo "❌ Nessun backup dello schema trovato!"
fi

echo ""
echo "===================================================="
echo "IMPORTANTE:"
echo "Il sistema ora dovrebbe usare i nomi lunghi originali"
echo "(User_AssistanceRequest_clientIdToUser, etc.)"
echo "ma almeno dovrebbe FUNZIONARE!"
