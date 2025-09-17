#!/bin/bash

echo "🔍 VERIFICA DEFINITIVA TRAVEL ROUTES"
echo "===================================="

cd backend

echo "1. Cerco il file principale delle route:"
find src -name "routes.ts" -o -name "index.ts" | grep -v node_modules | head -5

echo ""
echo "2. Verifica contenuto di travelCostRoutes.ts:"
head -20 src/routes/travelCostRoutes.ts

echo ""
echo "3. Aggiungo manualmente le route nel file giusto:"

# Cerco il file index.ts principale
if [ -f "src/index.ts" ]; then
  echo "Trovato src/index.ts"
  
  # Verifico se le route travel sono già registrate
  if ! grep -q "travelCostRoutes" src/index.ts; then
    echo "Aggiungo import e route..."
    
    # Backup
    cp src/index.ts src/index.ts.backup-$(date +%Y%m%d-%H%M%S)
    
    # Aggiungo dopo gli altri import di routes
    sed -i '' '/import.*routes.*from/a\
import travelCostRoutes from "./routes/travelCostRoutes";
' src/index.ts
    
    # Aggiungo dopo gli altri app.use
    sed -i '' '/app\.use.*api.*routes/a\
  app.use("/api/travel", travelCostRoutes);
' src/index.ts
    
    echo "✅ Route aggiunte in index.ts"
  else
    echo "⚠️ Route già presenti"
  fi
  
  echo ""
  echo "4. Verifica finale:"
  grep -n "travelCost" src/index.ts
  
elif [ -f "src/routes.ts" ]; then
  echo "Trovato src/routes.ts"
  
  if ! grep -q "travelCostRoutes" src/routes.ts; then
    echo "Aggiungo in routes.ts..."
    
    cp src/routes.ts src/routes.ts.backup-$(date +%Y%m%d-%H%M%S)
    
    sed -i '' '/import.*routes.*from/a\
import travelCostRoutes from "./routes/travelCostRoutes";
' src/routes.ts
    
    sed -i '' '/app\.use.*api.*routes/a\
  app.use("/api/travel", travelCostRoutes);
' src/routes.ts
    
    echo "✅ Route aggiunte in routes.ts"
  fi
  
  grep -n "travelCost" src/routes.ts
fi

echo ""
echo "===================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Se ancora non funziona, dimmi cosa c'è in src/index.ts"
