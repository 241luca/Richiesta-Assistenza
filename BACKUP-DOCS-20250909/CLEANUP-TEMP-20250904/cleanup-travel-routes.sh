#!/bin/bash

echo "🧹 PULIZIA DOPPIONI E VERIFICA TRAVEL ROUTES"
echo "==========================================="

cd backend

echo "1. Rimuovo il doppione che ho creato:"
rm -f src/routes/travel-costs.routes.ts
echo "✅ Doppione rimosso"

echo ""
echo "2. Verifica quale file è quello giusto:"
ls -la src/routes/travel*.ts src/routes/travelCost*.ts

echo ""
echo "3. Verifica se le route sono registrate:"
grep -n "travel\|Travel" src/routes.ts src/index.ts 2>/dev/null | head -10

echo ""
echo "4. Controllo il contenuto del file travel.routes.ts:"
grep -n "cost-settings\|professional" src/routes/travel.routes.ts | head -10

echo ""
echo "==========================================="
echo "Dimmi cosa mostra così possiamo capire"
echo "perché l'endpoint non funziona"
