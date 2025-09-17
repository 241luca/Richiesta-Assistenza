#!/bin/bash

echo "🔧 RISOLUZIONE SISTEMA INSTABILE - 29 Agosto 2025"
echo "================================================"

# 1. Verifica processi attivi
echo "📋 Controllo processi node attivi..."
ps aux | grep node | grep -v grep

echo ""
echo "📋 Controllo porte occupate..."
lsof -i :3200 2>/dev/null || echo "Porta 3200 libera"
lsof -i :5193 2>/dev/null || echo "Porta 5193 libera"

echo ""
echo "🔄 Terminazione processi node esistenti..."
# Termina tutti i processi node per evitare conflitti
pkill -f "node.*3200" 2>/dev/null || true
pkill -f "vite.*5193" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

sleep 2

echo "✅ Sistema pulito. Riavvio in corso..."
echo ""
echo "📝 NOTE:"
echo "1. Dopo aver eseguito questo script, riavviare manualmente:"
echo "   - Terminal 1: cd backend && npm run dev"
echo "   - Terminal 2: cd . && npm run dev" 
echo "2. Verificare che i server si avviino su:"
echo "   - Backend: http://localhost:3200"
echo "   - Frontend: http://localhost:5193"
echo "3. Se persistono errori 401, cancellare localStorage nel browser"
echo ""
echo "🎯 Correzioni già implementate:"
echo "- useAuth.ts: ResponseFormatter parsing corretto"
echo "- DashboardPage.tsx: Import aggiornato"
echo "- middleware auth.ts: Campo organization rimosso"
echo ""
echo "🧪 Test da eseguire dopo riavvio:"
echo "1. Login con Super Admin (admin@assistenza.it / password123)"
echo "2. Verificare che dashboard mostri 'Benvenuto, Super Admin!'"
echo "3. Controllare che WebSocket si connetta senza loop"

