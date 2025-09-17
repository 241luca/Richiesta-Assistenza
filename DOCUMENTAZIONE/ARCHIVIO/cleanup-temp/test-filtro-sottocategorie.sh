#!/bin/bash

echo "🔍 Test Filtro Sottocategorie con Professionisti"
echo "================================================"

# Test API subcategories
echo -e "\n📌 Test 1: Recupero sottocategorie con conteggio professionisti"
curl -s http://localhost:3200/api/subcategories \
  -H "Cookie: $(cat cookies.txt 2>/dev/null)" | \
  jq '.data[] | {name: .name, professionals: ._count.ProfessionalUserSubcategory, requests: ._count.AssistanceRequest}'

echo -e "\n📌 Test 2: Verifica professionisti attivi per sottocategoria"
curl -s http://localhost:3200/api/subcategories \
  -H "Cookie: $(cat cookies.txt 2>/dev/null)" | \
  jq '.data[] | select(._count.ProfessionalUserSubcategory > 0) | {name: .name, professionals: ._count.ProfessionalUserSubcategory}'

echo -e "\n📌 Test 3: Sottocategorie SENZA professionisti (da nascondere)"
curl -s http://localhost:3200/api/subcategories \
  -H "Cookie: $(cat cookies.txt 2>/dev/null)" | \
  jq '.data[] | select(._count.ProfessionalUserSubcategory == 0) | {name: .name}'

echo -e "\n✅ Test completato!"
