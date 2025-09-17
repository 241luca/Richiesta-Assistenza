#!/bin/bash

echo "🔧 Fix del sistema di backup e pricingData"
echo "=========================================="

cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend

echo ""
echo "1️⃣ Aggiungendo campo pricingData al database..."
echo "------------------------------------------------"
echo "Questo aggiungerà il campo pricingData alla tabella User nel database"
echo ""
echo "Premi ENTER per continuare o CTRL+C per annullare"
read

# Aggiungi il campo al database
npx prisma db push

echo ""
echo "✅ Campo aggiunto al database!"
echo ""
echo "2️⃣ Ora rigenero il client Prisma..."
npx prisma generate

echo ""
echo "✅ Client Prisma rigenerato!"
echo ""
echo "3️⃣ Riavvia il backend per applicare le modifiche"
echo ""
echo "Fatto! Gli errori dovrebbero essere risolti."
