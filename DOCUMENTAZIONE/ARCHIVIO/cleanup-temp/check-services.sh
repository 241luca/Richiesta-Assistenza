#!/bin/bash
# Script per verificare i servizi attivi

echo "=== VERIFICA SERVIZI ==="
echo ""

# Controlla porta 3200 (backend)
if lsof -i :3200 > /dev/null 2>&1; then
    echo "✅ Backend attivo su porta 3200"
else
    echo "❌ Backend NON attivo su porta 3200"
fi

# Controlla porta 5193 (frontend)
if lsof -i :5193 > /dev/null 2>&1; then
    echo "✅ Frontend attivo su porta 5193"
else
    echo "❌ Frontend NON attivo su porta 5193"
fi

# Controlla Redis
if pgrep redis-server > /dev/null; then
    echo "✅ Redis attivo"
else
    echo "❌ Redis NON attivo"
fi

echo ""
echo "=== TEST API BACKEND ==="
curl -s http://localhost:3200/api/health || echo "❌ Backend non risponde"

echo ""
echo "=== PROCESSI NODE ==="
ps aux | grep node | grep -v grep | head -5
