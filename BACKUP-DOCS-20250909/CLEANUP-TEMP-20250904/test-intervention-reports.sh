#!/bin/bash

# Test Script per Sistema Rapporti Intervento
# Esegui con: bash test-intervention-reports.sh

echo "================================================"
echo "🧪 TEST SISTEMA RAPPORTI INTERVENTO"
echo "================================================"

# Configurazione
API_URL="http://localhost:3200"
EMAIL="admin@example.com"
PASSWORD="Admin123!@#"

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}1. Test Health Check...${NC}"
HEALTH_RESPONSE=$(curl -s "${API_URL}/health")
echo "Response: $HEALTH_RESPONSE"

echo -e "\n${YELLOW}2. Login per ottenere token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

echo "Login Response: $LOGIN_RESPONSE"

# Estrai il token (assumendo che sia nel formato { "token": "..." })
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login fallito. Verifica credenziali.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Login riuscito! Token ottenuto.${NC}"

echo -e "\n================================================"
echo -e "${YELLOW}TEST CONFIGURAZIONE SISTEMA${NC}"
echo "================================================"

echo -e "\n3. GET Configurazione..."
curl -s -X GET "${API_URL}/api/intervention-reports/config" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool

echo -e "\n4. GET Tipi Campo..."
curl -s -X GET "${API_URL}/api/intervention-reports/field-types" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -50

echo -e "\n5. GET Stati..."
curl -s -X GET "${API_URL}/api/intervention-reports/statuses" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -50

echo -e "\n6. GET Tipi Intervento..."
curl -s -X GET "${API_URL}/api/intervention-reports/types" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -50

echo -e "\n7. GET Sezioni..."
curl -s -X GET "${API_URL}/api/intervention-reports/sections" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -50

echo -e "\n================================================"
echo -e "${YELLOW}TEST TEMPLATE${NC}"
echo "================================================"

echo -e "\n8. GET Template..."
curl -s -X GET "${API_URL}/api/intervention-reports/templates" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -50

echo -e "\n9. GET Template Specifico (ID=1)..."
curl -s -X GET "${API_URL}/api/intervention-reports/templates/1" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -50

echo -e "\n10. GET Campi Template..."
curl -s -X GET "${API_URL}/api/intervention-reports/templates/1/fields" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -50

echo -e "\n================================================"
echo -e "${YELLOW}TEST RAPPORTI${NC}"
echo "================================================"

echo -e "\n11. GET Rapporti..."
curl -s -X GET "${API_URL}/api/intervention-reports/reports" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -50

echo -e "\n12. GET Statistiche..."
curl -s -X GET "${API_URL}/api/intervention-reports/statistics" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool

echo -e "\n13. POST Nuovo Rapporto (test)..."
NEW_REPORT=$(curl -s -X POST "${API_URL}/api/intervention-reports/reports" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "test-1",
    "templateId": "1",
    "typeId": "1",
    "interventionDate": "2025-01-04",
    "formData": {
      "client_name": "Test Cliente",
      "client_address": "Via Test 123",
      "intervention_description": "Test creazione rapporto da script"
    },
    "isDraft": true
  }')

echo "Nuovo Rapporto: $NEW_REPORT" | python -m json.tool | head -30

echo -e "\n================================================"
echo -e "${GREEN}✅ TEST COMPLETATI!${NC}"
echo "================================================"
echo -e "Token utilizzato: ${TOKEN:0:20}..."
echo -e "\nSe vedi dati JSON sopra, le API funzionano correttamente!"
echo -e "Se vedi errori, controlla che il backend sia attivo sulla porta 3200"
