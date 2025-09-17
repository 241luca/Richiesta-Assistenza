#!/bin/bash

echo "🔧 ATTIVAZIONE SISTEMA BACKUP"
echo "================================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend

echo ""
echo "📊 STEP 1: Aggiornamento database con tabelle backup..."
npx prisma db push

echo ""
echo "✅ Database aggiornato!"

echo ""
echo "📦 STEP 2: Generazione Prisma Client..."
npx prisma generate

echo ""
echo "✅ Prisma Client generato!"

echo ""
echo "🧪 STEP 3: Test rapido API backup..."
curl -X GET http://localhost:3200/api/backup \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "================================"
echo "✅ SISTEMA BACKUP ATTIVATO!"
echo ""
echo "Ora puoi:"
echo "1. Riavviare il backend (npm run dev)"
echo "2. Andare su http://localhost:5193/admin/backup"
echo "3. Provare a creare un backup!"
