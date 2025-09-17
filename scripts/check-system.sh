#!/bin/bash

# check-system.sh - Script di verifica sistema
# Questo script viene usato dal Script Manager

echo "🔍 SYSTEM CHECK - Verifica completa del sistema"
echo "=============================================="
echo ""
echo "📅 Data/Ora: $(date)"
echo "👤 Utente: $(whoami)"
echo "📁 Directory: $(pwd)"
echo ""
echo "✅ Controllo servizi..."
echo ""

# Controlla se il backend è attivo
if curl -s http://localhost:3200/health > /dev/null; then
    echo "✅ Backend: ATTIVO (porta 3200)"
else
    echo "❌ Backend: NON ATTIVO"
fi

# Controlla se il frontend è attivo
if curl -s http://localhost:5193 > /dev/null; then
    echo "✅ Frontend: ATTIVO (porta 5193)"
else
    echo "❌ Frontend: NON ATTIVO"
fi

# Controlla Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: ATTIVO"
else
    echo "⚠️ Redis: NON ATTIVO (opzionale)"
fi

echo ""
echo "📊 Stato Database:"
cd backend 2>/dev/null && npx prisma db pull --print > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database PostgreSQL: CONNESSO"
else
    echo "❌ Database PostgreSQL: NON CONNESSO"
fi

echo ""
echo "✅ System check completato!"
echo "=============================================="
