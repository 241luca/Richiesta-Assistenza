#!/bin/bash

echo "🧪 TEST SISTEMA BACKUP"
echo "======================"

# Test se il backend risponde
echo ""
echo "1️⃣ Test connessione backend..."
curl -s http://localhost:3200/health | grep -q "ok" && echo "✅ Backend attivo" || echo "❌ Backend non risponde"

# Test autenticazione (usa il cookie esistente)
echo ""
echo "2️⃣ Test autenticazione..."
RESPONSE=$(curl -s -X GET http://localhost:3200/api/backup \
  -H "Content-Type: application/json" \
  -b /Users/lucamambelli/Desktop/richiesta-assistenza/cookies.txt \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API Backup funzionante!"
  echo "Risposta: $BODY" | head -c 200
elif [ "$HTTP_CODE" = "401" ]; then
  echo "⚠️ Non autenticato - Devi fare login prima"
elif [ "$HTTP_CODE" = "404" ]; then
  echo "❌ API non trovata - Route non registrata"
else
  echo "❌ Errore HTTP: $HTTP_CODE"
  echo "Risposta: $BODY"
fi

echo ""
echo "3️⃣ Test creazione backup..."
echo "Creando un backup di test del database..."

BACKUP_RESPONSE=$(curl -s -X POST http://localhost:3200/api/backup \
  -H "Content-Type: application/json" \
  -b /Users/lucamambelli/Desktop/richiesta-assistenza/cookies.txt \
  -d '{
    "type": "DATABASE",
    "description": "Test backup sistema",
    "includeDatabase": true,
    "includeUploads": false,
    "includeCode": false,
    "compression": false,
    "encrypted": false,
    "retentionDays": 7
  }' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$BACKUP_RESPONSE" | tail -n 1)
BODY=$(echo "$BACKUP_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Backup creato con successo!"
  echo "Dettagli: $BODY" | head -c 300
else
  echo "❌ Errore nella creazione backup: HTTP $HTTP_CODE"
  echo "Dettagli: $BODY"
fi

echo ""
echo "======================"
echo "Fine test"
