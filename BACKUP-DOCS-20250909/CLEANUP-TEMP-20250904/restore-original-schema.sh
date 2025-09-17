#!/bin/bash

echo "🔄 RIPRISTINO SOLO SCHEMA PRISMA"
echo "================================"

cd backend

# Trova il primo backup dello schema (il più vecchio, quindi l'originale)
ORIGINAL_SCHEMA=$(ls -t prisma/schema.prisma.backup-* 2>/dev/null | tail -1)

if [ -f "$ORIGINAL_SCHEMA" ]; then
    echo "Trovato schema originale: $ORIGINAL_SCHEMA"
    
    # Mostra le differenze
    echo ""
    echo "Differenze principali:"
    echo "----------------------"
    diff -u "$ORIGINAL_SCHEMA" prisma/schema.prisma | grep "^[-+].*@relation" | head -10
    
    echo ""
    echo "Ripristino schema originale..."
    cp "$ORIGINAL_SCHEMA" prisma/schema.prisma
    
    echo "✅ Schema ripristinato"
    echo ""
    echo "Rigenerazione Prisma Client con nomi originali..."
    npx prisma generate
    
    echo ""
    echo "================================"
    echo "✅ FATTO!"
    echo ""
    echo "Ora il sistema usa di nuovo i nomi originali:"
    echo "- User_AssistanceRequest_clientIdToUser"
    echo "- User_AssistanceRequest_professionalIdToUser"
    echo "- Category (con C maiuscola)"
    echo "- Subcategory (con S maiuscola)"
    echo ""
    echo "⚠️ RIAVVIA IL BACKEND e dovrebbe funzionare!"
else
    echo "❌ Nessun backup trovato"
    echo ""
    echo "Scarico lo schema originale dal database..."
    npx prisma db pull --force
    echo "✅ Schema scaricato dal database"
    
    npx prisma generate
    echo "✅ Client rigenerato"
fi
