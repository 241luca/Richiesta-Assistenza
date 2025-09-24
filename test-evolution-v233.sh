#!/bin/bash

# Test connessione Evolution API v2.3.3
# Da eseguire dal Mac locale per testare il VPS
# Data: 22 Settembre 2025

echo "================================================"
echo "TEST EVOLUTION API v2.3.3 su VPS"
echo "================================================"
echo ""

# Configurazione
VPS_IP="37.27.89.35"
API_KEY="evolution_key_luca_2025_secure_21806"

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Test connessione base
echo -e "${BLUE}1. Test connessione API...${NC}"
if curl -s http://${VPS_IP}:8080/ | grep -q "Evolution"; then
    echo -e "   ${GREEN}✅ API raggiungibile${NC}"
else
    echo -e "   ${RED}❌ API non raggiungibile${NC}"
    exit 1
fi
echo ""

# 2. Test autenticazione
echo -e "${BLUE}2. Test autenticazione...${NC}"
RESPONSE=$(curl -s -X GET http://${VPS_IP}:8080/instance/fetchInstances \
  -H "apikey: ${API_KEY}")

if echo "$RESPONSE" | grep -q "error"; then
    echo -e "   ${RED}❌ Errore autenticazione${NC}"
    echo "   Response: $RESPONSE"
else
    echo -e "   ${GREEN}✅ Autenticazione OK${NC}"
fi
echo ""

# 3. Lista istanze
echo -e "${BLUE}3. Istanze WhatsApp:${NC}"
curl -s -X GET http://${VPS_IP}:8080/instance/fetchInstances \
  -H "apikey: ${API_KEY}" | python3 -m json.tool 2>/dev/null || echo "Nessuna istanza trovata"
echo ""

# 4. Test webhook server
echo -e "${BLUE}4. Test webhook server...${NC}"
if curl -s http://${VPS_IP}:3201/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://${VPS_IP}:3201/health)
    echo -e "   ${GREEN}✅ Webhook server attivo${NC}"
    echo "   $HEALTH"
else
    echo -e "   ${YELLOW}⚠️  Webhook server non raggiungibile dall'esterno${NC}"
    echo "   (Potrebbe essere normale se il firewall blocca la porta 3201)"
fi
echo ""

# 5. Crea/verifica istanza main
echo -e "${BLUE}5. Verifica istanza 'main'...${NC}"
INSTANCE_CHECK=$(curl -s -X GET http://${VPS_IP}:8080/instance/connectionState/main \
  -H "apikey: ${API_KEY}")

if echo "$INSTANCE_CHECK" | grep -q "error"; then
    echo -e "   ${YELLOW}Istanza 'main' non trovata, creazione in corso...${NC}"
    
    # Crea istanza
    CREATE_RESPONSE=$(curl -s -X POST http://${VPS_IP}:8080/instance/create \
      -H "apikey: ${API_KEY}" \
      -H "Content-Type: application/json" \
      -d '{
        "instanceName": "main",
        "qrcode": true,
        "integration": "WHATSAPP-BAILEYS"
      }')
    
    if echo "$CREATE_RESPONSE" | grep -q "instance"; then
        echo -e "   ${GREEN}✅ Istanza 'main' creata${NC}"
    else
        echo -e "   ${RED}❌ Errore creazione istanza${NC}"
        echo "   Response: $CREATE_RESPONSE"
    fi
else
    echo -e "   ${GREEN}✅ Istanza 'main' esistente${NC}"
    echo "   Stato: $INSTANCE_CHECK"
fi
echo ""

# 6. Ottieni QR code
echo -e "${BLUE}6. QR Code per connessione WhatsApp...${NC}"
QR_RESPONSE=$(curl -s -X GET http://${VPS_IP}:8080/instance/connect/main \
  -H "apikey: ${API_KEY}")

if echo "$QR_RESPONSE" | grep -q "qrcode"; then
    echo -e "   ${GREEN}✅ QR Code disponibile${NC}"
    echo ""
    echo "   Per visualizzare il QR:"
    echo "   1. Apri: http://${VPS_IP}:8080/manager"
    echo "   2. Login con API key: ${API_KEY}"
    echo "   3. Vai all'istanza 'main'"
    echo "   4. Scansiona con WhatsApp"
elif echo "$QR_RESPONSE" | grep -q "CONNECTED"; then
    echo -e "   ${GREEN}✅ WhatsApp già connesso!${NC}"
else
    echo -e "   ${YELLOW}⚠️  QR non disponibile${NC}"
    echo "   Response: $QR_RESPONSE"
fi

echo ""
echo "================================================"
echo -e "${GREEN}📊 RIEPILOGO${NC}"
echo "================================================"
echo "• Evolution API: http://${VPS_IP}:8080"
echo "• Manager UI: http://${VPS_IP}:8080/manager"
echo "• API Key: ${API_KEY}"
echo "• Webhook: http://${VPS_IP}:3201 (interno)"
echo ""
echo -e "${YELLOW}INTEGRAZIONE CON RICHIESTA ASSISTENZA:${NC}"
echo "1. Aggiorna .env.evolution con:"
echo "   EVOLUTION_API_URL=http://${VPS_IP}:8080"
echo "   EVOLUTION_API_KEY=${API_KEY}"
echo "2. Riavvia il backend locale"
echo "3. Testa da: http://localhost:5193/admin/whatsapp"
echo "================================================"
