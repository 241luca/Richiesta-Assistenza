#!/bin/bash

echo "=== TEST AUTENTICAZIONE SISTEMA RICHIESTA ASSISTENZA ==="
echo "Sistema senza multi-tenancy - Test completo"
echo "=========================================="

API_URL="http://localhost:3200/api"

# Test 1: Registrazione CLIENT
echo -e "\n📝 TEST 1: Registrazione CLIENT..."
curl -X POST $API_URL/auth/register \
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
  -s | jq .

sleep 1

# Test 2: Registrazione PROFESSIONAL
echo -e "\n🔧 TEST 2: Registrazione PROFESSIONAL..."
curl -X POST $API_URL/auth/register \
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
  -s | jq .

sleep 1

# Test 3: Login CLIENT
echo -e "\n🔐 TEST 3: Login CLIENT..."
CLIENT_LOGIN=$(curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client.test@example.com",
    "password": "Test123!"
  }' \
  -s)

echo "$CLIENT_LOGIN" | jq .
CLIENT_TOKEN=$(echo "$CLIENT_LOGIN" | jq -r .token)
echo "Token CLIENT salvato: ${CLIENT_TOKEN:0:20}..."

# Test 4: Login PROFESSIONAL
echo -e "\n🔐 TEST 4: Login PROFESSIONAL..."
PROF_LOGIN=$(curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prof.test@example.com",
    "password": "Test123!"
  }' \
  -s)

echo "$PROF_LOGIN" | jq .
PROF_TOKEN=$(echo "$PROF_LOGIN" | jq -r .token)
echo "Token PROFESSIONAL salvato: ${PROF_TOKEN:0:20}..."

# Test 5: Test accesso autenticato CLIENT
echo -e "\n👤 TEST 5: Profilo CLIENT autenticato..."
curl -X GET $API_URL/auth/me \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -s | jq .

# Test 6: Test accesso autenticato PROFESSIONAL
echo -e "\n👤 TEST 6: Profilo PROFESSIONAL autenticato..."
curl -X GET $API_URL/auth/me \
  -H "Authorization: Bearer $PROF_TOKEN" \
  -s | jq .

echo -e "\n✅ TEST AUTENTICAZIONE COMPLETATI!"
echo "=========================================="
