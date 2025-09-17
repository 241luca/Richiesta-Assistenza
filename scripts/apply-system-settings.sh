#!/bin/bash

echo "🔧 Applica schema SystemSettings al database..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "1️⃣ Generazione Prisma Client..."
npx prisma generate

echo ""
echo "2️⃣ Push schema al database..."
npx prisma db push

echo ""
echo "✅ Schema applicato! Il backend dovrebbe riavviarsi automaticamente con nodemon."
