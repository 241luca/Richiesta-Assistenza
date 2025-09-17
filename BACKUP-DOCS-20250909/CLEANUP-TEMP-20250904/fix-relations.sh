#!/bin/bash

echo "🔧 FIX RELAZIONI MANCANTI"
echo "========================="

cd backend

echo "1️⃣ Applicazione prisma format per sistemare le relazioni..."
npx prisma format

if [ $? -eq 0 ]; then
    echo "✅ Schema formattato"
    
    echo ""
    echo "2️⃣ Validazione schema..."
    npx prisma validate
    
    if [ $? -eq 0 ]; then
        echo "✅ Schema valido!"
        
        echo ""
        echo "3️⃣ Generazione Prisma Client..."
        npx prisma generate
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ TUTTO SISTEMATO!"
        else
            echo "❌ Errore nella generazione"
        fi
    else
        echo "❌ Ancora errori di validazione"
        echo ""
        echo "Mostro gli errori specifici:"
        npx prisma validate 2>&1 | grep -A 2 "Error validating"
    fi
else
    echo "❌ Errore nel format"
fi
