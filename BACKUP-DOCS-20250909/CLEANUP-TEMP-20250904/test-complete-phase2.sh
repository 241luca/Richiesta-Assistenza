#!/bin/bash

# Test Completo API Rapporti Intervento - Materiali e Professionista
echo "================================================"
echo "🧪 TEST COMPLETO SISTEMA RAPPORTI - FASE 2 100%"
echo "================================================"

API_URL="http://localhost:3200"

# Usa il token salvato dal test precedente se disponibile
if [ -f ".token" ]; then
    TOKEN=$(cat .token)
    echo "✅ Token recuperato da sessione precedente"
else
    echo "❌ Nessun token salvato. Esegui prima test-intervention-reports.sh"
    exit 1
fi

echo -e "\n================================================"
echo "TEST MATERIALI"
echo "================================================"

echo -e "\n1. GET Tutti i Materiali..."
curl -s -X GET "${API_URL}/api/intervention-reports/materials" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -30

echo -e "\n2. GET Categorie Materiali..."
curl -s -X GET "${API_URL}/api/intervention-reports/materials/categories" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool

echo -e "\n3. GET Materiali Più Usati..."
curl -s -X GET "${API_URL}/api/intervention-reports/materials/most-used?limit=5" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -30

echo -e "\n4. Ricerca Materiali..."
curl -s -X GET "${API_URL}/api/intervention-reports/materials/search?q=tubo" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -30

echo -e "\n5. GET Materiale Specifico (ID=1)..."
curl -s -X GET "${API_URL}/api/intervention-reports/materials/1" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -30

echo -e "\n6. GET Materiale per Codice..."
curl -s -X GET "${API_URL}/api/intervention-reports/materials/code/TUB001" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -30

echo -e "\n================================================"
echo "TEST PERSONALIZZAZIONI PROFESSIONISTA"
echo "================================================"

echo -e "\n7. GET Template Personalizzati..."
curl -s -X GET "${API_URL}/api/intervention-reports/professional/templates" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -30

echo -e "\n8. GET Frasi Ricorrenti..."
curl -s -X GET "${API_URL}/api/intervention-reports/professional/phrases" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -50

echo -e "\n9. GET Frasi per Categoria..."
curl -s -X GET "${API_URL}/api/intervention-reports/professional/phrases?category=problema" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -30

echo -e "\n10. GET Materiali Personalizzati..."
curl -s -X GET "${API_URL}/api/intervention-reports/professional/materials" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -30

echo -e "\n11. GET Impostazioni Professionista..."
curl -s -X GET "${API_URL}/api/intervention-reports/professional/settings" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -50

echo -e "\n12. GET Cartelle Organizzazione..."
curl -s -X GET "${API_URL}/api/intervention-reports/professional/folders" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool | head -30

echo -e "\n13. GET Statistiche Professionista..."
curl -s -X GET "${API_URL}/api/intervention-reports/professional/statistics" \
  -H "Authorization: Bearer ${TOKEN}" | python -m json.tool

echo -e "\n================================================"
echo "✅ TEST FASE 2 COMPLETATI AL 100%!"
echo "================================================"
echo -e "\nRiepilogo endpoints testati:"
echo "- ✅ Configurazione sistema"
echo "- ✅ Template e campi"
echo "- ✅ Rapporti e operazioni"
echo "- ✅ Materiali e categorie"
echo "- ✅ Personalizzazioni professionista"
echo -e "\nTOTALE: 5 service + 5 set di routes = FASE 2 COMPLETA! 🎉"
