#!/bin/bash

echo "🔍 DEBUG TIMEOUT ISSUE"
echo "====================="

cd backend

echo "1. Verifica se il backend è in crash:"
ps aux | grep "node.*server" | grep -v grep || echo "⚠️ Backend non in esecuzione"

echo ""
echo "2. Verifica l'endpoint che causa timeout:"
grep -A 20 "'/professional/:professionalId/cost-settings'" src/routes/travelCostRoutes.ts | head -25

echo ""
echo "3. Verifica se travelCostService esiste:"
if [ -f "src/services/travelCostService.ts" ]; then
  echo "✅ travelCostService.ts esiste"
  echo "Verifico getCostSettings:"
  grep -A 10 "getCostSettings" src/services/travelCostService.ts | head -15
else
  echo "❌ travelCostService.ts NON ESISTE!"
  echo "Creo un service mock per farlo funzionare:"
  
  mkdir -p src/services
  cat > src/services/travelCostService.ts << 'SERVICE'
export const travelCostService = {
  async getCostSettings(professionalId: string) {
    // Mock implementation - ritorna dati di default
    return null; // Questo farà ritornare le impostazioni di default nel route
  }
};
SERVICE
  echo "✅ Service mock creato"
fi

echo ""
echo "====================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Se il problema era il service mancante,"
echo "ora dovrebbe funzionare con dati di default"
