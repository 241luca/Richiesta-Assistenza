#!/bin/bash

echo "🔧 Applicazione tabella Professions al database"
echo "=============================================="
echo ""

cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend

echo "1️⃣ Applicando le modifiche allo schema..."
echo "----------------------------------------"
# Prima facciamo push dello schema
npx prisma db push

echo ""
echo "2️⃣ Eseguendo script SQL per popolare le professioni..."
echo "-------------------------------------------------------"
# Esegui lo script SQL per popolare le professioni
psql $DATABASE_URL < ../add-professions-table.sql

echo ""
echo "3️⃣ Rigenerando il client Prisma..."
echo "-----------------------------------"
npx prisma generate

echo ""
echo "✅ Completato!"
echo ""
echo "Ora puoi:"
echo "1. Riavviare il backend"
echo "2. Testare la nuova funzionalità nella pagina competenze"
echo ""
echo "Le professioni predefinite inserite sono:"
echo "- Idraulico"
echo "- Elettricista"  
echo "- Muratore"
echo "- Imbianchino"
echo "- Fabbro"
echo "- Falegname"
echo "- Giardiniere"
echo "- Tecnico Climatizzazione"
echo "- Vetraio"
echo "- Piastrellista"
echo "- Antennista"
echo "- Tecnico Informatico"
echo "- Tecnico Elettrodomestici"
echo "- Serramentista"
echo "- Pulizie"
