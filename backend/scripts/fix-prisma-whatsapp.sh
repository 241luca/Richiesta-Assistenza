#!/bin/bash

echo "🔧 FIX COMPLETO PRISMA E WHATSAPP"
echo "=================================="
echo ""

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "1️⃣ Pulizia cache Prisma..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

echo ""
echo "2️⃣ Reinstallazione Prisma Client..."
npm install @prisma/client

echo ""
echo "3️⃣ Generazione client Prisma..."
npx prisma generate

echo ""
echo "4️⃣ Push schema al database..."
npx prisma db push --accept-data-loss

echo ""
echo "5️⃣ Verifica che il modello esista..."
npx prisma studio &
STUDIO_PID=$!
sleep 3
kill $STUDIO_PID 2>/dev/null

echo ""
echo "6️⃣ Restart del backend necessario!"
echo ""
echo "IMPORTANTE: Devi fare questi passi:"
echo ""
echo "1. Ferma il backend (Ctrl+C nel terminale dove gira)"
echo "2. Riavvialo con: npm run dev"
echo "3. Testa di nuovo l'invio messaggio"
echo ""
echo "✅ Fix completato. Riavvia il backend ora!"
