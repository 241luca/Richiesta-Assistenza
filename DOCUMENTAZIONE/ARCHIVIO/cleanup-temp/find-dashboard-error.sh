#!/bin/bash

echo "🔍 TROVA FILE USER-DASHBOARD.ROUTES"
echo "===================================="

cd backend

echo "Cerca linea 275 nel file..."
sed -n '270,280p' src/routes/dashboard/user-dashboard.routes.ts

echo ""
echo "===================================="
echo "Cerca tutte le occorrenze di 'client:' nel file..."
grep -n "client:" src/routes/dashboard/user-dashboard.routes.ts | head -10

echo ""
echo "===================================="
echo "Mostra le relazioni corrette per AssistanceRequest..."
grep -n "User_AssistanceRequest" src/routes/dashboard/user-dashboard.routes.ts | head -5
