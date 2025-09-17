#!/bin/bash

echo "🔍 CONTROLLO GENERALE ERRORI"
echo "============================"

cd backend

echo "1. Verifica se il backend è in esecuzione:"
ps aux | grep "node.*server" | grep -v grep | head -2

echo ""
echo "2. Ultimi errori nel backend (se ci sono log):"
if [ -f "logs/error.log" ]; then
  tail -5 logs/error.log
elif [ -f "error.log" ]; then
  tail -5 error.log
else
  echo "Nessun file di log trovato"
fi

echo ""
echo "3. Fix logging [object Object]:"
echo "Cerco dove viene loggato male:"
grep -r "logger.error(error)" src/routes/*.ts 2>/dev/null | head -5

echo ""
echo "4. Sistemo il logging nei file problematici:"
# Fix professionals.routes.ts
if [ -f "src/routes/professionals.routes.ts" ]; then
  sed -i '' 's/logger.error(error)/logger.error("Error:", error)/g' src/routes/professionals.routes.ts
  echo "✅ Fixed professionals.routes.ts"
fi

# Fix altri file con lo stesso problema
find src/routes -name "*.ts" -exec sed -i '' 's/logger.error(error)/logger.error("Error:", error)/g' {} \;
find src/routes -name "*.ts" -exec sed -i '' 's/logger.error(err)/logger.error("Error:", err)/g' {} \;

echo ""
echo "5. Verifica ResponseFormatter:"
if grep -q "ResponseFormatter.success" src/routes/travelCostRoutes.ts; then
  echo "✅ ResponseFormatter usato in travelCostRoutes"
else
  echo "❌ ResponseFormatter non trovato"
fi

echo ""
echo "============================"
echo "RIAVVIA IL BACKEND!"
echo ""
echo "I log dovrebbero ora mostrare gli errori reali"
echo "invece di [object Object]"
