#!/bin/bash

# Imposta il DATABASE_URL
export DATABASE_URL="postgresql://lucamambelli@localhost:5432/assistenza_db"

echo "🔍 Test Professionisti per Sottocategoria"
echo "=========================================="

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Verifica sottocategorie con professionisti
echo -e "\n${YELLOW}📌 Test 1: Conta professionisti per sottocategoria${NC}"
psql $DATABASE_URL -c "
SELECT 
  s.id as subcategory_id,
  s.name as subcategory_name,
  COUNT(pus.id) as professional_count
FROM \"Subcategory\" s
LEFT JOIN \"ProfessionalUserSubcategory\" pus ON s.id = pus.\"subcategoryId\"
  AND pus.\"isActive\" = true
LEFT JOIN \"User\" u ON pus.\"userId\" = u.id
  AND u.role = 'PROFESSIONAL'
GROUP BY s.id, s.name
ORDER BY professional_count DESC;
"

# Test 2: Verifica professionisti attivi
echo -e "\n${YELLOW}📌 Test 2: Lista professionisti attivi con sottocategorie${NC}"
psql $DATABASE_URL -c "
SELECT 
  u.id,
  u.\"fullName\",
  u.role,
  s.name as subcategory,
  pus.\"isActive\"
FROM \"User\" u
JOIN \"ProfessionalUserSubcategory\" pus ON u.id = pus.\"userId\"
JOIN \"Subcategory\" s ON pus.\"subcategoryId\" = s.id
WHERE u.role = 'PROFESSIONAL'
  AND pus.\"isActive\" = true
LIMIT 10;
"

# Test 3: Verifica una sottocategoria specifica (prendi la prima richiesta con sottocategoria)
echo -e "\n${YELLOW}📌 Test 3: Dettaglio richiesta con sottocategoria${NC}"
psql $DATABASE_URL -c "
SELECT 
  ar.id as request_id,
  ar.title,
  s.id as subcategory_id,
  s.name as subcategory_name,
  ar.status
FROM \"AssistanceRequest\" ar
JOIN \"Subcategory\" s ON ar.\"subcategoryId\" = s.id
WHERE ar.\"subcategoryId\" IS NOT NULL
ORDER BY ar.\"createdAt\" DESC
LIMIT 5;
"

# Test 4: Verifica professionisti per una sottocategoria specifica
echo -e "\n${YELLOW}📌 Test 4: Prendi una sottocategoria e verifica i suoi professionisti${NC}"
SUBCATEGORY_ID=$(psql $DATABASE_URL -t -c "
SELECT s.id 
FROM \"AssistanceRequest\" ar
JOIN \"Subcategory\" s ON ar.\"subcategoryId\" = s.id
WHERE ar.\"subcategoryId\" IS NOT NULL
ORDER BY ar.\"createdAt\" DESC
LIMIT 1;
" | xargs)

if [ ! -z "$SUBCATEGORY_ID" ]; then
  echo "Sottocategoria trovata: $SUBCATEGORY_ID"
  
  echo -e "\n${YELLOW}Professionisti per questa sottocategoria:${NC}"
  psql $DATABASE_URL -c "
  SELECT 
    u.id,
    u.\"fullName\",
    u.city,
    u.province,
    pus.\"experienceYears\",
    pus.\"isActive\"
  FROM \"ProfessionalUserSubcategory\" pus
  JOIN \"User\" u ON pus.\"userId\" = u.id
  WHERE pus.\"subcategoryId\" = '$SUBCATEGORY_ID'
    AND pus.\"isActive\" = true
    AND u.role = 'PROFESSIONAL';
  "
else
  echo -e "${RED}Nessuna richiesta con sottocategoria trovata${NC}"
fi

echo -e "\n${GREEN}✅ Test completato!${NC}"
