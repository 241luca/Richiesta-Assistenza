#!/bin/bash

# Script di test per EvolutionAPI
# Data: 21 Settembre 2025
# Autore: Luca Mambelli

echo "🚀 TEST EVOLUTIONAPI - Sistema Richiesta Assistenza"
echo "=================================================="
echo ""

# Colori per output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check Docker
echo "1️⃣ Verifica Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker installato${NC}"
    docker --version
else
    echo -e "${RED}❌ Docker non trovato! Installalo prima.${NC}"
    exit 1
fi

# 2. Check Docker Compose
echo ""
echo "2️⃣ Verifica Docker Compose..."
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose disponibile${NC}"
else
    echo -e "${YELLOW}⚠️ Docker Compose non trovato, usando docker compose${NC}"
fi

# 3. Avvia EvolutionAPI
echo ""
echo "3️⃣ Avvio EvolutionAPI..."
echo -e "${YELLOW}Usando docker-compose.evolution.yml${NC}"

# Ferma eventuali container esistenti
docker-compose -f docker-compose.evolution.yml down 2>/dev/null || true

# Avvia i container
docker-compose -f docker-compose.evolution.yml up -d

# Attendi che i servizi siano pronti
echo ""
echo "⏳ Attendo che i servizi siano pronti (30 secondi)..."
sleep 30

# 4. Test EvolutionAPI
echo ""
echo "4️⃣ Test connessione EvolutionAPI..."
EVOLUTION_URL="http://localhost:8080"
EVOLUTION_KEY="evolution_secure_key_2025_luca_mambelli"

# Test health endpoint
echo "Testing: $EVOLUTION_URL"
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $EVOLUTION_URL)

if [ "$HEALTH_RESPONSE" = "200" ] || [ "$HEALTH_RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ EvolutionAPI risponde! (HTTP $HEALTH_RESPONSE)${NC}"
else
    echo -e "${RED}❌ EvolutionAPI non risponde (HTTP $HEALTH_RESPONSE)${NC}"
    echo "Verifica i log con: docker-compose -f docker-compose.evolution.yml logs evolution-api"
    exit 1
fi

# 5. Test creazione istanza
echo ""
echo "5️⃣ Test creazione istanza WhatsApp..."
INSTANCE_RESPONSE=$(curl -s -X POST \
  "$EVOLUTION_URL/instance/create" \
  -H "apikey: $EVOLUTION_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "main",
    "qrcode": true,
    "integration": "BAILEYS"
  }')

if echo "$INSTANCE_RESPONSE" | grep -q "instance" || echo "$INSTANCE_RESPONSE" | grep -q "already"; then
    echo -e "${GREEN}✅ Istanza WhatsApp creata/esistente${NC}"
else
    echo -e "${YELLOW}⚠️ Possibile problema con creazione istanza${NC}"
    echo "Risposta: $INSTANCE_RESPONSE"
fi

# 6. Test Backend
echo ""
echo "6️⃣ Test backend (porta 3200)..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/health)

if [ "$BACKEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Backend attivo${NC}"
else
    echo -e "${YELLOW}⚠️ Backend non risponde. Avvialo con: cd backend && npm run dev${NC}"
fi

# 7. Test Frontend
echo ""
echo "7️⃣ Test frontend (porta 5193)..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5193)

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend attivo${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend non risponde. Avvialo con: npm run dev${NC}"
fi

# 8. Riepilogo
echo ""
echo "=================================================="
echo "📊 RIEPILOGO TEST"
echo "=================================================="
echo ""

# Check container status
CONTAINERS=$(docker-compose -f docker-compose.evolution.yml ps --format json 2>/dev/null || docker compose -f docker-compose.evolution.yml ps --format json)

echo "🐳 Container Docker:"
docker-compose -f docker-compose.evolution.yml ps 2>/dev/null || docker compose -f docker-compose.evolution.yml ps

echo ""
echo "🔗 URL Importanti:"
echo "   EvolutionAPI: http://localhost:8080"
echo "   Backend: http://localhost:3200"
echo "   Frontend: http://localhost:5193"
echo "   PostgreSQL: localhost:5433"
echo "   Redis: localhost:6380"

echo ""
echo "📝 Prossimi passi:"
echo "   1. Apri il browser su http://localhost:5193"
echo "   2. Vai in Admin → WhatsApp"
echo "   3. Clicca 'Crea Istanza'"
echo "   4. Scansiona il QR Code con WhatsApp"

echo ""
echo "🛠️ Comandi utili:"
echo "   Logs Evolution: docker-compose -f docker-compose.evolution.yml logs -f evolution-api"
echo "   Stop tutto: docker-compose -f docker-compose.evolution.yml down"
echo "   Restart: docker-compose -f docker-compose.evolution.yml restart"

echo ""
echo -e "${GREEN}✅ Test completato!${NC}"