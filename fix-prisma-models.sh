#!/bin/bash

echo "Verificando i modelli Prisma..."
cd backend

echo "1. Generando Prisma Client..."
npx prisma generate

echo ""
echo "2. Verificando se il modello WhatsAppContact esiste..."
npx prisma studio &
STUDIO_PID=$!
sleep 3
kill $STUDIO_PID 2>/dev/null

echo ""
echo "3. Applicando migrazioni al database..."
npx prisma db push

echo ""
echo "✅ Fatto! Ora riavvia il backend con: npm run dev"
