#!/bin/bash

# Verifica dove è salvato l'Instance ID
echo "🔍 VERIFICA POSIZIONE INSTANCE ID"
echo "================================"
echo ""

DB_URL=$(grep DATABASE_URL /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.env | cut -d '=' -f2- | tr -d '"')

echo "1️⃣ Cerca in SystemConfiguration:"
echo "--------------------------------"
psql "$DB_URL" -c "SELECT key, value FROM \"SystemConfiguration\" WHERE key LIKE '%instance%' OR key LIKE '%whatsapp%';" 2>/dev/null

echo ""
echo "2️⃣ Cerca in ApiKey (tabella WhatsApp):"
echo "--------------------------------------"
psql "$DB_URL" -c "SELECT service, metadata, \"createdAt\" FROM \"ApiKey\" WHERE service='WHATSAPP';" 2>/dev/null

echo ""
echo "3️⃣ Se metadata è NULL, dobbiamo aggiornarlo con l'Instance ID:"
echo "--------------------------------------------------------------"
echo "UPDATE \"ApiKey\" SET metadata = '{\"instanceId\": \"68C67956807C8\"}' WHERE service='WHATSAPP';"
