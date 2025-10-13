#!/bin/bash

# Script di verifica ResponseFormatter
# Assicura che ResponseFormatter sia usato correttamente nel progetto

echo "🔍 Verifica utilizzo ResponseFormatter..."
echo "========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contatori
ERRORS=0
WARNINGS=0

# 1. Verifica che ResponseFormatter NON sia nei services
echo ""
echo "1️⃣  Verificando che ResponseFormatter NON sia nei services..."
SERVICES_WITH_RF=$(grep -r "ResponseFormatter" backend/src/services/ 2>/dev/null | wc -l)

if [ $SERVICES_WITH_RF -gt 0 ]; then
  echo -e "${RED}❌ ERRORE: Trovato ResponseFormatter nei services!${NC}"
  echo "   I services NON devono mai usare ResponseFormatter!"
  echo "   Files problematici:"
  grep -r "ResponseFormatter" backend/src/services/ 2>/dev/null | cut -d: -f1 | sort | uniq
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ OK: Nessun ResponseFormatter nei services${NC}"
fi

# 2. Verifica che tutte le routes usino ResponseFormatter
echo ""
echo "2️⃣  Verificando che TUTTE le routes usino ResponseFormatter..."

# Trova tutte le risposte senza ResponseFormatter
ROUTES_WITHOUT_RF=$(grep -r "res\.json\|res\.status" backend/src/routes/ 2>/dev/null | grep -v "ResponseFormatter" | grep -v "test" | grep -v "spec" | wc -l)

if [ $ROUTES_WITHOUT_RF -gt 0 ]; then
  echo -e "${RED}❌ ERRORE: Trovate routes senza ResponseFormatter!${NC}"
  echo "   TUTTE le routes devono usare ResponseFormatter!"
  echo "   Righe problematiche:"
  grep -r "res\.json\|res\.status" backend/src/routes/ 2>/dev/null | grep -v "ResponseFormatter" | grep -v "test" | grep -v "spec" | head -10
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ OK: Tutte le routes usano ResponseFormatter${NC}"
fi

# 3. Verifica che ci sia sempre return davanti a ResponseFormatter
echo ""
echo "3️⃣  Verificando che ci sia sempre 'return' davanti a ResponseFormatter..."

RF_WITHOUT_RETURN=$(grep -r "ResponseFormatter" backend/src/routes/ 2>/dev/null | grep -v "return" | grep -v "//" | grep -v "import" | wc -l)

if [ $RF_WITHOUT_RETURN -gt 0 ]; then
  echo -e "${YELLOW}⚠️  WARNING: Possibili ResponseFormatter senza 'return'${NC}"
  echo "   Verificare manualmente questi casi:"
  grep -r "ResponseFormatter" backend/src/routes/ 2>/dev/null | grep -v "return" | grep -v "//" | grep -v "import" | head -5
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ OK: Tutti i ResponseFormatter hanno 'return'${NC}"
fi

# 4. Verifica import corretto
echo ""
echo "4️⃣  Verificando import corretto di ResponseFormatter..."

WRONG_IMPORTS=$(grep -r "from.*responseFormatter" backend/src/routes/ 2>/dev/null | grep -v "from '../utils/responseFormatter'" | grep -v "from '../../utils/responseFormatter'" | wc -l)

if [ $WRONG_IMPORTS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  WARNING: Import non standard di ResponseFormatter${NC}"
  echo "   Verificare questi import:"
  grep -r "from.*responseFormatter" backend/src/routes/ 2>/dev/null | grep -v "from '../utils/responseFormatter'" | grep -v "from '../../utils/responseFormatter'"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ OK: Import corretti${NC}"
fi

# 5. Conta utilizzi totali
echo ""
echo "5️⃣  Statistiche utilizzo ResponseFormatter..."

TOTAL_SUCCESS=$(grep -r "ResponseFormatter.success" backend/src/routes/ 2>/dev/null | wc -l)
TOTAL_ERROR=$(grep -r "ResponseFormatter.error" backend/src/routes/ 2>/dev/null | wc -l)
TOTAL_ROUTES=$(find backend/src/routes -name "*.ts" -not -name "*.test.ts" -not -name "*.spec.ts" 2>/dev/null | wc -l)

echo "   📊 Totale file routes: $TOTAL_ROUTES"
echo "   ✅ ResponseFormatter.success: $TOTAL_SUCCESS utilizzi"
echo "   ❌ ResponseFormatter.error: $TOTAL_ERROR utilizzi"
echo "   📈 Totale utilizzi: $((TOTAL_SUCCESS + TOTAL_ERROR))"

# Report finale
echo ""
echo "========================================="
echo "📊 REPORT FINALE"
echo "========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ PERFETTO! ResponseFormatter è usato correttamente!${NC}"
  echo "   Nessun errore trovato."
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  ATTENZIONE: Trovati $WARNINGS warning da verificare${NC}"
  echo "   Il sistema funziona ma ci sono miglioramenti possibili."
  exit 0
else
  echo -e "${RED}❌ ERRORI CRITICI: Trovati $ERRORS errori e $WARNINGS warning${NC}"
  echo "   CORREGGERE PRIMA DI COMMITTARE!"
  echo ""
  echo "   Per correggere:"
  echo "   1. Rimuovi ResponseFormatter dai services"
  echo "   2. Aggiungi ResponseFormatter a TUTTE le routes"
  echo "   3. Metti sempre 'return' davanti a ResponseFormatter"
  exit 1
fi
