#!/bin/bash

echo "🔍 Controllo TypeScript Strict Mode sui 4 file Health Check..."
echo "================================================"
echo ""

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Lista dei file da controllare
FILES=(
  "src/services/healthCheck.service.ts"
  "src/services/health-check-automation/orchestrator.ts"
  "src/services/health-check-automation/auto-remediation.ts"
  "src/services/health-check-automation/report-generator.ts"
)

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Controlla ogni file
for file in "${FILES[@]}"; do
  echo -e "${YELLOW}📂 Controllo: $file${NC}"
  
  # Esegui il controllo TypeScript strict
  npx tsc --noEmit --strict --skipLibCheck "$file" 2>&1 | head -20
  
  if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✅ Nessun errore strict mode!${NC}"
  else
    echo -e "${RED}❌ Errori trovati (vedi sopra)${NC}"
  fi
  
  echo "---"
  echo ""
done

echo "🎯 Controllo completato!"
