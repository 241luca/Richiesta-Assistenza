#!/bin/bash

echo "🧪 Test Sistema Assegnazione e Data Intervento"
echo "=============================================="

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Verifica endpoint assegnazione
echo -e "\n${YELLOW}📌 Test 1: Verifica endpoint assegnazione${NC}"
curl -s -X POST http://localhost:3200/api/requests/test-id/assign \
  -H "Cookie: $(cat cookies.txt 2>/dev/null)" \
  -H "Content-Type: application/json" \
  -d '{"professionalId": "test-prof-id", "notes": "Test assegnazione"}' | \
  jq '.'

# Test 2: Verifica endpoint data intervento
echo -e "\n${YELLOW}📌 Test 2: Verifica endpoint data intervento${NC}"
curl -s -X PATCH http://localhost:3200/api/requests/test-id/schedule \
  -H "Cookie: $(cat cookies.txt 2>/dev/null)" \
  -H "Content-Type: application/json" \
  -d '{"scheduledDate": "2025-01-15T10:00:00Z", "notes": "Arrivo alle 10"}' | \
  jq '.'

# Test 3: Verifica campi nel database
echo -e "\n${YELLOW}📌 Test 3: Verifica campi assegnazione nel database${NC}"
psql $DATABASE_URL -c "
SELECT 
  id,
  status,
  assignment_type,
  assigned_by,
  assigned_at,
  scheduled_date
FROM \"AssistanceRequest\"
WHERE assignment_type IS NOT NULL
LIMIT 5;
"

echo -e "\n${GREEN}✅ Test completato!${NC}"
echo ""
echo "Prossimi passi per testare manualmente:"
echo "1. Vai su http://localhost:5193"
echo "2. Crea una nuova richiesta come cliente"
echo "3. Accedi come admin e assegna la richiesta"
echo "4. Accedi come professionista e imposta la data"
echo "5. Verifica che lo stato cambi in IN_PROGRESS"
