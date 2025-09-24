#!/bin/bash

# Crea istanza WhatsApp su Evolution API
# Da eseguire sul VPS
# Data: 22 Settembre 2025

echo "================================================"
echo "CREAZIONE ISTANZA WHATSAPP"
echo "================================================"
echo ""

# Colori
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_KEY="evolution_key_luca_2025_secure_21806"
INSTANCE_NAME="${1:-main}"

echo -e "${BLUE}Creando istanza: ${INSTANCE_NAME}${NC}"
echo ""

# 1. Verifica se istanza esiste già
echo "1. Verificando se l'istanza esiste..."
CHECK=$(curl -s -X GET http://localhost:8080/instance/connectionState/${INSTANCE_NAME} \
  -H "apikey: ${API_KEY}")

if echo "$CHECK" | grep -q "state"; then
    echo -e "   ${YELLOW}⚠️  Istanza '${INSTANCE_NAME}' già esistente${NC}"
    echo "   Stato attuale: $CHECK"
    echo ""
    read -p "Vuoi ricrearla? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 0
    fi
    
    # Elimina istanza esistente
    echo "   Eliminando istanza esistente..."
    curl -s -X DELETE http://localhost:8080/instance/delete/${INSTANCE_NAME} \
      -H "apikey: ${API_KEY}" > /dev/null
    sleep 2
fi

# 2. Crea nuova istanza
echo ""
echo "2. Creando nuova istanza..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:8080/instance/create \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"instanceName\": \"${INSTANCE_NAME}\",
    \"qrcode\": true,
    \"integration\": \"WHATSAPP-BAILEYS\"
  }")

if echo "$CREATE_RESPONSE" | grep -q "instance"; then
    echo -e "   ${GREEN}✅ Istanza creata con successo${NC}"
    echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"
else
    echo -e "   ${RED}❌ Errore nella creazione${NC}"
    echo "   Response: $CREATE_RESPONSE"
    exit 1
fi

# 3. Configura webhook per l'istanza
echo ""
echo "3. Configurando webhook..."
WEBHOOK_RESPONSE=$(curl -s -X POST http://localhost:8080/webhook/set/${INSTANCE_NAME} \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"enabled\": true,
    \"url\": \"http://localhost:3201/api/whatsapp/webhook/${INSTANCE_NAME}\",
    \"webhookByEvents\": false,
    \"events\": [
      \"APPLICATION_STARTUP\",
      \"QRCODE_UPDATED\",
      \"CONNECTION_UPDATE\",
      \"MESSAGES_UPSERT\",
      \"MESSAGES_UPDATE\",
      \"SEND_MESSAGE\",
      \"CONTACTS_UPSERT\",
      \"GROUPS_UPSERT\"
    ]
  }")

if echo "$WEBHOOK_RESPONSE" | grep -q "webhook"; then
    echo -e "   ${GREEN}✅ Webhook configurato${NC}"
else
    echo -e "   ${YELLOW}⚠️  Configurazione webhook potrebbe non essere riuscita${NC}"
fi

# 4. Ottieni QR Code
echo ""
echo "4. Generando QR Code..."
sleep 2

QR_RESPONSE=$(curl -s -X GET http://localhost:8080/instance/connect/${INSTANCE_NAME} \
  -H "apikey: ${API_KEY}")

if echo "$QR_RESPONSE" | grep -q "qrcode"; then
    echo -e "   ${GREEN}✅ QR Code generato${NC}"
    
    # Estrai il QR code
    QR_CODE=$(echo "$QR_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('qrcode', {}).get('base64', ''))" 2>/dev/null)
    
    if [ ! -z "$QR_CODE" ]; then
        # Salva QR in file HTML
        cat > ~/qrcode-${INSTANCE_NAME}.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>QR Code WhatsApp - ${INSTANCE_NAME}</title>
    <style>
        body { 
            font-family: Arial; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh;
            background: #f0f0f0;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        img { 
            max-width: 300px; 
            margin: 20px 0;
        }
        .status {
            padding: 10px;
            background: #ffeaa7;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>WhatsApp QR Code</h1>
        <p>Istanza: <strong>${INSTANCE_NAME}</strong></p>
        <img src="${QR_CODE}" alt="QR Code" />
        <div class="status">
            <p>📱 Scansiona con WhatsApp</p>
            <p>Impostazioni → Dispositivi collegati → Collega dispositivo</p>
        </div>
        <p style="color: #666; margin-top: 20px;">
            Generato: $(date '+%d/%m/%Y %H:%M:%S')
        </p>
    </div>
</body>
</html>
EOF
        echo ""
        echo -e "   ${GREEN}📄 QR Code salvato in: ~/qrcode-${INSTANCE_NAME}.html${NC}"
        echo "   Scaricalo e aprilo nel browser per scansionare"
    fi
    
elif echo "$QR_RESPONSE" | grep -q "CONNECTED"; then
    echo -e "   ${GREEN}✅ WhatsApp già connesso!${NC}"
    echo "   Non serve scansionare il QR"
else
    echo -e "   ${YELLOW}⚠️  Stato non chiaro${NC}"
    echo "   Response: $QR_RESPONSE"
fi

# 5. Verifica stato finale
echo ""
echo "5. Verifica stato connessione..."
sleep 2
STATE=$(curl -s -X GET http://localhost:8080/instance/connectionState/${INSTANCE_NAME} \
  -H "apikey: ${API_KEY}")

echo "   Stato: $STATE"

echo ""
echo "================================================"
echo -e "${GREEN}✅ PROCESSO COMPLETATO${NC}"
echo "================================================"
echo ""
echo "📱 Istanza: ${INSTANCE_NAME}"
echo "🔑 API Key: ${API_KEY}"
echo ""

if [ -f ~/qrcode-${INSTANCE_NAME}.html ]; then
    echo "📄 QR Code: ~/qrcode-${INSTANCE_NAME}.html"
    echo ""
    echo "Per scaricare il QR sul tuo Mac:"
    echo "scp root@37.27.89.35:~/qrcode-${INSTANCE_NAME}.html ./"
    echo ""
fi

echo "🔄 Webhook configurato su: http://localhost:3201"
echo ""
echo "📝 Prossimi passi:"
echo "1. Scarica e apri il file HTML con il QR"
echo "2. Scansiona con WhatsApp"
echo "3. Verifica connessione con: ./test-evolution.sh"
echo ""
