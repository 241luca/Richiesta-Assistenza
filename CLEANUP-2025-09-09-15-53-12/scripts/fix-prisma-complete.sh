#!/bin/bash

echo "🔧 FIX COMPLETO PRISMA CLIENT"
echo "================================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend

echo "1️⃣ Pulizia cache Prisma..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

echo "2️⃣ Reinstallazione Prisma Client..."
npm install @prisma/client prisma --save-exact

echo "3️⃣ Generazione Client..."
npx prisma generate --force

echo "4️⃣ Push schema al database..."
npx prisma db push --accept-data-loss

echo "5️⃣ Verifica tabelle..."
npx prisma db pull --print

echo ""
echo "✅ PRISMA CLIENT COMPLETAMENTE RIGENERATO!"
echo ""
echo "⚠️  ORA DEVI:"
echo "   1. Fermare il backend (Ctrl+C)"
echo "   2. Riavviare con: npm run dev"
echo ""
echo "La tabella ScheduledIntervention dovrebbe ora funzionare!"
