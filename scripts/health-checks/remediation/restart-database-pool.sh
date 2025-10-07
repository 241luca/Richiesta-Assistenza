#!/bin/bash

# Restart Database Connection Pool
# Script per riavviare il pool di connessioni al database

echo "🔄 Restarting database connection pool..."

# Trova il processo del backend
BACKEND_PID=$(lsof -ti:3200)

if [ -z "$BACKEND_PID" ]; then
    echo "❌ Backend not running on port 3200"
    exit 1
fi

# Invia segnale per graceful restart del pool
kill -USR2 $BACKEND_PID

# Attendi un momento
sleep 2

# Verifica che il backend sia ancora attivo
if lsof -i:3200 > /dev/null 2>&1; then
    echo "✅ Database pool restarted successfully"
    exit 0
else
    echo "❌ Backend stopped unexpectedly, attempting restart..."
    cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend
    npm run dev &
    sleep 5
    
    if lsof -i:3200 > /dev/null 2>&1; then
        echo "✅ Backend restarted successfully"
        exit 0
    else
        echo "❌ Failed to restart backend"
        exit 1
    fi
fi