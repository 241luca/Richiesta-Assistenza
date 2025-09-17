#!/bin/bash

echo "🔧 REGISTRA TRAVELCOSTROUTES NEL SERVER"
echo "======================================"

cd backend

echo "1. Aggiungo import e registrazione di travelCostRoutes:"

cat > /tmp/register-travelcost.js << 'SCRIPT'
const fs = require('fs');

let content = fs.readFileSync('src/server.ts', 'utf8');

// Aggiungi l'import dopo l'altro import travel
if (!content.includes('travelCostRoutes')) {
  content = content.replace(
    "import travelRoutes from './routes/travel.routes';",
    "import travelRoutes from './routes/travel.routes';\nimport travelCostRoutes from './routes/travelCostRoutes';"
  );
  
  // Aggiungi la registrazione dopo l'altra route travel
  content = content.replace(
    "app.use('/api/travel', authenticate, travelRoutes);",
    "app.use('/api/travel', authenticate, travelRoutes);\napp.use('/api/travel', authenticate, travelCostRoutes);"
  );
  
  fs.writeFileSync('src/server.ts', content);
  console.log('✅ travelCostRoutes registrato');
} else {
  console.log('⚠️ travelCostRoutes già presente');
}
SCRIPT

node /tmp/register-travelcost.js
rm -f /tmp/register-travelcost.js

echo ""
echo "2. Verifica registrazione:"
grep -n "travelCostRoutes" src/server.ts

echo ""
echo "======================================"
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ora entrambe le travel routes sono registrate:"
echo "- travel.routes.ts"
echo "- travelCostRoutes.ts" 
echo ""
echo "L'endpoint /api/travel/professional/:id/cost-settings"
echo "dovrebbe finalmente funzionare!"
