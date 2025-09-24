#!/bin/bash

# Script per creare nuova istanza WhatsApp dopo aggiornamento
# Data: 22 Settembre 2025

echo "================================================"
echo "CREAZIONE NUOVA ISTANZA WHATSAPP"
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

echo -e "${BLUE}Nome istanza: ${INSTANCE_NAME}${NC}"
echo ""

# 1. Test API
echo "1. Verificando API..."
if ! curl -s http://localhost:8080 | grep -q "Evolution"; then
    echo -e "   ${RED}❌ API non risponde${NC}"
    exit 1
fi
echo "   ✅ API attiva"
echo ""

# 2. Crea istanza
echo "2. Creando istanza '$INSTANCE_NAME'..."
CREATE_RESPONSE=$(curl -s -X POST http://localhost:8080/instance/create \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"instanceName\": \"${INSTANCE_NAME}\",
    \"qrcode\": true,
    \"integration\": \"WHATSAPP-BAILEYS\"
  }")

if echo "$CREATE_RESPONSE" | grep -q "instance"; then
    echo "   ✅ Istanza creata"
else
    echo "   ❌ Errore creazione"
    echo "   $CREATE_RESPONSE"
    exit 1
fi
echo ""

# 3. Configura webhook
echo "3. Configurando webhook..."
curl -s -X POST http://localhost:8080/webhook/set/${INSTANCE_NAME} \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"enabled\": true,
    \"url\": \"http://localhost:3201/api/whatsapp/webhook/${INSTANCE_NAME}\",
    \"webhookByEvents\": false
  }" > /dev/null

echo "   ✅ Webhook configurato"
echo ""

# 4. Genera QR
echo "4. Generando QR Code..."
sleep 2

QR_RESPONSE=$(curl -s -X GET http://localhost:8080/instance/connect/${INSTANCE_NAME} \
  -H "apikey: ${API_KEY}")

if echo "$QR_RESPONSE" | grep -q "qrcode\|base64"; then
    echo "   ✅ QR Code disponibile"
    
    # Estrai base64
    QR_BASE64=$(echo "$QR_RESPONSE" | grep -o '"base64":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$QR_BASE64" ]; then
        # Crea HTML con QR
        cat > ~/qr-${INSTANCE_NAME}.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp QR - ${INSTANCE_NAME}</title>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 400px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .instance {
            color: #667eea;
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 20px;
        }
        .qr-container {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        img {
            max-width: 280px;
            height: auto;
        }
        .instructions {
            background: #e8f5e9;
            color: #2e7d32;
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            font-size: 14px;
        }
        .status {
            background: #fff3e0;
            color: #e65100;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            margin-top: 20px;
        }
        .api-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 WhatsApp QR Code</h1>
        <div class="instance">Istanza: ${INSTANCE_NAME}</div>
        
        <div class="qr-container">
            <img src="data:image/png;base64,${QR_BASE64}" alt="QR Code" />
        </div>
        
        <div class="instructions">
            <strong>Come scansionare:</strong><br>
            1. Apri WhatsApp sul telefono<br>
            2. Vai in Impostazioni → Dispositivi collegati<br>
            3. Tocca "Collega dispositivo"<br>
            4. Scansiona questo QR code
        </div>
        
        <div class="status">
            ⏱️ QR valido per 60 secondi<br>
            Generato: $(date '+%H:%M:%S - %d/%m/%Y')
        </div>
        
        <div class="api-info">
            API: 37.27.89.35:8080<br>
            Evolution API v2.3.3
        </div>
    </div>
</body>
</html>
EOF
        
        echo ""
        echo -e "   ${GREEN}📄 File QR salvato: ~/qr-${INSTANCE_NAME}.html${NC}"
        echo ""
        echo "   Per scaricare sul Mac:"
        echo "   scp root@37.27.89.35:~/qr-${INSTANCE_NAME}.html ./"
    fi
    
elif echo "$QR_RESPONSE" | grep -q "CONNECTED"; then
    echo "   ✅ WhatsApp già connesso!"
else
    echo "   ⚠️  Stato non chiaro: $QR_RESPONSE"
fi
echo ""

# 5. Verifica stato
echo "5. Stato connessione..."
STATE=$(curl -s -X GET http://localhost:8080/instance/connectionState/${INSTANCE_NAME} \
  -H "apikey: ${API_KEY}")
echo "   $STATE"
echo ""

echo "================================================"
echo -e "${GREEN}✅ ISTANZA CREATA${NC}"
echo "================================================"
echo ""
echo "📱 Istanza: ${INSTANCE_NAME}"
echo "🔑 API Key: ${API_KEY}"
echo ""

if [ -f ~/qr-${INSTANCE_NAME}.html ]; then
    echo "📄 QR Code: ~/qr-${INSTANCE_NAME}.html"
    echo ""
    echo "Scarica il file con:"
    echo "scp root@37.27.89.35:~/qr-${INSTANCE_NAME}.html ./"
    echo ""
    echo "Poi aprilo nel browser e scansiona con WhatsApp"
fi

echo ""
echo "🔧 Configurazione backend locale:"
echo "Nel file .env.evolution:"
echo "EVOLUTION_API_URL=http://37.27.89.35:8080"
echo "EVOLUTION_API_KEY=${API_KEY}"
echo "EVOLUTION_DEFAULT_INSTANCE=${INSTANCE_NAME}"
echo ""
echo "================================================"
