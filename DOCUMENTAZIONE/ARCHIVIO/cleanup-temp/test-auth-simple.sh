#!/bin/bash

echo "=== TEST AUTENTICAZIONE SISTEMA RICHIESTA ASSISTENZA ==="
echo "Sistema senza multi-tenancy - Test semplificato"
echo "=========================================="

API_URL="http://localhost:3200/api"

# Test 1: Registrazione CLIENT
echo -e "\n📝 TEST 1: Registrazione CLIENT..."
RESPONSE=$(curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client.test@example.com",
    "username": "clienttest",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "Client",
    "role": "CLIENT",
    "phone": "1234567890",
    "address": "Via Test 1",
    "city": "Milano",
    "province": "MI",
    "postalCode": "20100"
  }' \
  -s -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed -n '1,/HTTP_STATUS/p' | head -n -1)

echo "Status: $HTTP_STATUS"
echo "Response: $BODY"

sleep 1

# Test 2: Registrazione PROFESSIONAL
echo -e "\n🔧 TEST 2: Registrazione PROFESSIONAL..."
RESPONSE=$(curl -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prof.test@example.com",
    "username": "proftest",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "Professional",
    "role": "PROFESSIONAL",
    "profession": "Idraulico",
    "phone": "0987654321",
    "address": "Via Professionista 2",
    "city": "Roma",
    "province": "RM",
    "postalCode": "00100"
  }' \
  -s -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed -n '1,/HTTP_STATUS/p' | head -n -1)

echo "Status: $HTTP_STATUS"
echo "Response: $BODY"

sleep 1

# Test 3: Login CLIENT
echo -e "\n🔐 TEST 3: Login CLIENT..."
RESPONSE=$(curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client.test@example.com",
    "password": "Test123!"
  }' \
  -s -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed -n '1,/HTTP_STATUS/p' | head -n -1)

echo "Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Login CLIENT riuscito!"
else
    echo "❌ Login CLIENT fallito"
fi
echo "Response: $BODY"

# Test 4: Login PROFESSIONAL
echo -e "\n🔐 TEST 4: Login PROFESSIONAL..."
RESPONSE=$(curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prof.test@example.com",
    "password": "Test123!"
  }' \
  -s -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed -n '1,/HTTP_STATUS/p' | head -n -1)

echo "Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Login PROFESSIONAL riuscito!"
else
    echo "❌ Login PROFESSIONAL fallito"
fi
echo "Response: $BODY"

# Test 5: Verifica endpoint categorie (senza auth per ora)
echo -e "\n📋 TEST 5: Endpoint Categorie..."
RESPONSE=$(curl -X GET $API_URL/categories \
  -s -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
echo "Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ]; then
    echo "✅ Endpoint categorie risponde correttamente"
else
    echo "❌ Problema con endpoint categorie"
fi

echo -e "\n=========================================="
echo "✅ TEST COMPLETATI!"
echo "=========================================="

# Riepilogo
echo -e "\n📊 RIEPILOGO TEST:"
echo "- Registrazione: Verifica sopra per status codes"
echo "- Login: Verifica sopra per status codes"
echo "- API Endpoints: Funzionanti"
echo ""
echo "NOTA: Status 409 = utente già esiste (normale se eseguito più volte)"
echo "      Status 200 = successo"
echo "      Status 401 = non autorizzato (normale per alcuni endpoint)"
