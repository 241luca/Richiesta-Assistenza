#!/bin/bash

echo "🔧 FIX ENDPOINT TRAVEL COST SETTINGS"
echo "===================================="

cd backend

echo "1. Aggiungo l'endpoint con il percorso corretto:"

cat > /tmp/add-professional-endpoint.js << 'SCRIPT'
const fs = require('fs');

let content = fs.readFileSync('src/routes/travelCostRoutes.ts', 'utf8');

// Aggiungi il nuovo endpoint dopo il primo
const newEndpoint = `
/**
 * GET /api/travel/professional/:professionalId/cost-settings
 * Recupera le impostazioni dei costi di viaggio per un professionista specifico
 */
router.get('/professional/:professionalId/cost-settings', authenticateUser, async (req, res) => {
  try {
    const { professionalId } = req.params;
    const requestingUserId = req.user?.id;
    
    // Verifica autorizzazioni (può vedere solo le proprie o se è admin)
    if (requestingUserId !== professionalId && req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return ResponseFormatter.forbidden(res, 'Non autorizzato a visualizzare queste impostazioni');
    }

    const settings = await travelCostService.getCostSettings(professionalId);
    
    if (!settings) {
      // Ritorna impostazioni di default se non esistono
      const defaultSettings = {
        professionalId: professionalId,
        baseCost: 1000, // €10.00
        freeDistanceKm: 0,
        isActive: false,
        costRanges: [
          { fromKm: 0, toKm: 10, costPerKm: 100 },
          { fromKm: 10, toKm: 50, costPerKm: 80 },
          { fromKm: 50, toKm: null, costPerKm: 60 }
        ],
        supplements: [
          { supplementType: 'WEEKEND', percentage: 20, fixedAmount: 0, isActive: false },
          { supplementType: 'NIGHT', percentage: 30, fixedAmount: 0, isActive: false },
          { supplementType: 'HOLIDAY', percentage: 50, fixedAmount: 0, isActive: false },
          { supplementType: 'URGENT', percentage: 0, fixedAmount: 2000, isActive: false }
        ]
      };
      
      return ResponseFormatter.success(res, defaultSettings, 'Impostazioni di default');
    }

    return ResponseFormatter.success(res, settings, 'Impostazioni recuperate con successo');
  } catch (error) {
    logger.error('Errore nel recupero delle impostazioni costi:', error);
    return ResponseFormatter.error(res, 'Errore nel recupero delle impostazioni');
  }
});
`;

// Trova dove inserire (dopo il primo router.get)
const firstRouteIndex = content.indexOf('router.get(\'/cost-settings\'');
if (firstRouteIndex !== -1) {
  // Trova la fine del primo route
  let braceCount = 0;
  let inRoute = false;
  let endIndex = firstRouteIndex;
  
  for (let i = firstRouteIndex; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
      inRoute = true;
    } else if (content[i] === '}') {
      braceCount--;
      if (inRoute && braceCount === 0) {
        endIndex = i + 3; // Include });
        break;
      }
    }
  }
  
  // Inserisci il nuovo endpoint
  content = content.slice(0, endIndex) + '\n' + newEndpoint + '\n' + content.slice(endIndex);
}

fs.writeFileSync('src/routes/travelCostRoutes.ts', content);
console.log('✅ Endpoint aggiunto');
SCRIPT

node /tmp/add-professional-endpoint.js
rm -f /tmp/add-professional-endpoint.js

echo ""
echo "2. Verifica che sia stato aggiunto:"
grep -n "professional/:professionalId/cost-settings" src/routes/travelCostRoutes.ts

echo ""
echo "===================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "L'endpoint /api/travel/professional/:id/cost-settings"
echo "ora dovrebbe funzionare!"
