#!/bin/bash
# Script per avviare tutti i servizi

echo "=== AVVIO SERVIZI RICHIESTA ASSISTENZA ==="
echo ""

# Avvia Redis se non attivo
if ! pgrep redis-server > /dev/null; then
    echo "Avvio Redis..."
    redis-server > /dev/null 2>&1 &
    sleep 2
fi

# Avvia Backend
echo "Avvio Backend su porta 3200..."
cd /Users/lucamambelli/Desktop/richiesta-assistenza/backend
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 5

# Avvia Frontend
echo "Avvio Frontend su porta 5193..."
cd /Users/lucamambelli/Desktop/richiesta-assistenza
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
sleep 5

echo ""
echo "=== SERVIZI AVVIATI ==="
echo "Backend: http://localhost:3200"
echo "Frontend: http://localhost:5193"
echo ""
echo "Per fermare i servizi usa: kill $BACKEND_PID $FRONTEND_PID"
