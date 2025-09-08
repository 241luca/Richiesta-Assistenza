#!/bin/bash

echo "🔍 Test diretto API Audit Log..."
echo "================================"

# Login per ottenere token
echo -e "\n1. Login come admin..."
RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@assistenza.it","password":"Admin123!"}')

# Estrai il token
TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login fallito. Provo con altre credenziali..."
  RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"superadmin@lmtecnologie.it","password":"SuperAdmin123!"}')
  TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Impossibile ottenere token"
  exit 1
fi

echo "✅ Token ottenuto"

# Test API audit/logs
echo -e "\n2. Chiamata API /api/audit/logs..."
echo "-----------------------------------"
AUDIT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  http://localhost:3200/api/audit/logs \
  -H "Authorization: Bearer $TOKEN")

HTTP_STATUS=$(echo "$AUDIT_RESPONSE" | grep HTTP_STATUS | cut -d':' -f2)
BODY=$(echo "$AUDIT_RESPONSE" | sed '/HTTP_STATUS/d')

echo "Status Code: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ API risponde correttamente!"
  
  # Conta i logs
  TOTAL=$(echo $BODY | grep -o '"total":[0-9]*' | cut -d':' -f2)
  echo -e "\n📊 TOTALE LOGS NEL DATABASE: $TOTAL"
  
  if [ "$TOTAL" -gt "50" ]; then
    echo "🎉 PERFETTO! Ci sono $TOTAL record."
    echo -e "\n✨ IL SISTEMA FUNZIONA!"
    echo "👉 Vai su http://localhost:5193/admin/audit per vedere l'interfaccia"
  else
    echo "⚠️ Solo $TOTAL record. Potrebbero servire più dati."
  fi
else
  echo "❌ Errore API: $HTTP_STATUS"
  echo "Risposta: $BODY"
fi
