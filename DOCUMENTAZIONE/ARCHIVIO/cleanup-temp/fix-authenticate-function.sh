#!/bin/bash

echo "🔧 FIX AUTHENTICATE FUNCTION IN TRAVELCOSTROUTES"
echo "=============================================="

cd backend

echo "1. Verifica cosa viene importato:"
head -10 src/routes/travelCostRoutes.ts

echo ""
echo "2. Correggo authenticateUser -> authenticate:"
sed -i '' 's/authenticateUser/authenticate/g' src/routes/travelCostRoutes.ts
echo "✅ Cambiato: authenticateUser -> authenticate"

echo ""
echo "3. Sistemo l'import corretto:"
sed -i '' "s|import { authenticateUser } from '../middleware/auth';|import { authenticate } from '../middleware/auth';|g" src/routes/travelCostRoutes.ts
echo "✅ Import corretto"

echo ""
echo "4. Verifica finale delle prime righe:"
head -15 src/routes/travelCostRoutes.ts

echo ""
echo "=============================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "L'errore di autenticazione dovrebbe essere risolto"
