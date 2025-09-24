#!/bin/bash

# Script di avvio completo sistema con EvolutionAPI
# Data: 21 Settembre 2025
# Autore: Luca Mambelli

echo "🚀 AVVIO SISTEMA RICHIESTA ASSISTENZA CON EVOLUTIONAPI"
echo "======================================================"
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Avvia Docker containers
echo -e "${BLUE}1️⃣ Avvio container Docker (Evolution + PostgreSQL + Redis)...${NC}"
docker-compose -f docker-compose.evolution.yml up -d

# Attendi che i servizi siano pronti
echo "⏳ Attendo 20 secondi per l'avvio dei servizi..."
sleep 20

# 2. Avvia Backend
echo ""
echo -e "${BLUE}2️⃣ Avvio Backend (porta 3200)...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..
sleep 5

# 3. Avvia Frontend
echo ""
echo -e "${BLUE}3️⃣ Avvio Frontend (porta 5193)...${NC}"
npm run dev &
FRONTEND_PID=$!
sleep 5

# 4. Mostra status
echo ""
echo "======================================================"
echo -e "${GREEN}✅ SISTEMA AVVIATO CON SUCCESSO!${NC}"
echo "======================================================"
echo ""
echo "🔗 URL del sistema:"
echo "   Frontend: http://localhost:5193"
echo "   Backend API: http://localhost:3200"
echo "   EvolutionAPI: http://localhost:8080"
echo ""
echo "📱 Per configurare WhatsApp:"
echo "   1. Vai su http://localhost:5193/admin"
echo "   2. Clicca su 'WhatsApp' nel menu"
echo "   3. Clicca 'Crea Istanza' e poi 'Genera QR Code'"
echo "   4. Scansiona con WhatsApp"
echo ""
echo -e "${YELLOW}⚠️  Per fermare tutto: Premi Ctrl+C${NC}"
echo ""

# Mantieni lo script in esecuzione
wait $BACKEND_PID
wait $FRONTEND_PID