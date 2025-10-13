#!/bin/bash

echo "🚀 AVVIO SISTEMA COMPLETO"
echo "========================="

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Libera la porta 3200 prima dell'avvio
if lsof -i :3200 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend in esecuzione sulla porta 3200 — termino processo${NC}"
    BPIDS=$(lsof -t -i:3200)
    if [ -n "$BPIDS" ]; then
        kill -TERM $BPIDS 2>/dev/null || true
        sleep 1
        if lsof -i :3200 > /dev/null 2>&1; then
            kill -9 $BPIDS 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ Porta 3200 liberata${NC}"
    fi
fi

# Avvio backend
if ! lsof -i :3200 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Avvio Backend...${NC}"
    cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend
    npm run dev &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    
    # Aspetta che il backend sia pronto
    echo "Attendo che il backend sia pronto..."
    for i in {1..30}; do
        if curl -s http://localhost:3200/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend pronto!${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
    echo ""
fi

# Libera la porta 5193 prima dell'avvio del frontend
if lsof -i :5193 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Frontend in esecuzione sulla porta 5193 — termino processo${NC}"
    FPIDS=$(lsof -t -i:5193)
    if [ -n "$FPIDS" ]; then
        kill -TERM $FPIDS 2>/dev/null || true
        sleep 1
        if lsof -i :5193 > /dev/null 2>&1; then
            kill -9 $FPIDS 2>/dev/null || true
        fi
        echo -e "${GREEN}✅ Porta 5193 liberata${NC}"
    fi
fi

# Avvio frontend se la porta è libera
if ! lsof -i :5193 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Avvio Frontend...${NC}"
    cd /Users/lucamambelli/Desktop/Richiesta-Assistenza
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend PID: $FRONTEND_PID"
fi

# Controlla Redis (opzionale)
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis già in esecuzione${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis non in esecuzione (opzionale)${NC}"
        echo "   Per avviarlo: redis-server"
    fi
else
    echo -e "${YELLOW}ℹ️  Redis non installato (opzionale)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 SISTEMA AVVIATO!${NC}"
echo ""
echo "📍 URL disponibili:"
echo "   Frontend: http://localhost:5193"
echo "   Backend API: http://localhost:3200/api"
echo "   WhatsApp Dashboard: http://localhost:5193/admin/whatsapp/dashboard"
echo "   WhatsApp Manager: http://localhost:5193/admin/whatsapp"
echo ""
echo "📝 Per fermare il sistema:"
echo "   Premi Ctrl+C"
echo ""
echo "Logs in tempo reale..."
echo "======================="

# Mantieni lo script in esecuzione e mostra i log
wait
