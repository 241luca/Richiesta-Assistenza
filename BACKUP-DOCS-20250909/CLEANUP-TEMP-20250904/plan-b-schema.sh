#!/bin/bash

echo "🔄 PIANO B: SCHEMA DAL DATABASE"
echo "==============================="

cd backend

# Backup schema attuale problematico
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
mv prisma/schema.prisma "prisma/schema.problematico-$TIMESTAMP.prisma"

echo "1️⃣ Backup schema problematico salvato"

# Pull nuovo schema dal database
echo "2️⃣ Generazione schema dal database esistente..."
npx prisma db pull

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema generato dal database!"
    
    echo ""
    echo "3️⃣ Generazione Prisma Client..."
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ TUTTO RISOLTO! Schema e Client sincronizzati col database!"
    fi
else
    echo "❌ Errore nel pull dal database"
fi
