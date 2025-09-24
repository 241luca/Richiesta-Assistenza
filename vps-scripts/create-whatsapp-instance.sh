#!/bin/bash

# Script semplice per creare istanza WhatsApp
# Data: 22 Settembre 2025

echo "================================================"
echo "CREA ISTANZA WHATSAPP"
echo "================================================"
echo ""

API_KEY="evolution_key_luca_2025_secure_21806"
INSTANCE_NAME="${1:-main}"

# 1. Verifica API
echo "Verificando API..."
if ! curl -s http://localhost:8080 | grep -q "Evolution"; then
    echo "❌ API non attiva. Avvia prima Evolution API"
    exit 1
fi
echo "✅ API attiva"
echo ""

# 2. Crea istanza
echo "Creando istanza '$INSTANCE_NAME'..."
RESPONSE=$(curl -s -X POST http://localhost:8080/instance/create \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"instanceName\": \"${INSTANCE_NAME}\",
    \"token\": \"${API_KEY}\",
    \"qrcode\": true
  }")

echo "Response: $RESPONSE"
echo ""

# 3. Ottieni QR
echo "Ottenendo QR code..."
sleep 2

# Prova diversi endpoint per il QR
QR=$(curl -s http://localhost:8080/instance/connect/${INSTANCE_NAME} \
  -H "apikey: ${API_KEY}")

if echo "$QR" | grep -q "base64\|qrcode"; then
    echo "✅ QR disponibile"
    
    # Salva QR
    echo "$QR" > ~/qr-response.json
    
    # Crea HTML semplice
    cat > ~/qr.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp QR</title>
    <style>
        body { 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            height: 100vh;
            font-family: Arial;
            background: #f0f0f0;
        }
        .container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        #qrcode {
            margin: 20px 0;
            padding: 20px;
            background: #fafafa;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 WhatsApp QR Code</h1>
        <div id="qrcode">
            <p>Controlla il file qr-response.json</p>
            <p>Cerca il campo base64 o qrcode</p>
            <p>Copia il valore e incollalo in un decoder online</p>
        </div>
        <p>Oppure prova:</p>
        <p><a href="http://37.27.89.35:8080/instance/qr/main/image" target="_blank">
            Visualizza QR direttamente
        </a></p>
    </div>
</body>
</html>
EOF
    
    echo ""
    echo "📄 File salvati:"
    echo "• ~/qr-response.json (contiene il QR)"
    echo "• ~/qr.html (pagina helper)"
    echo ""
    echo "Scarica con:"
    echo "scp root@37.27.89.35:~/qr-response.json ./"
    
else
    echo "⚠️ QR non disponibile o già connesso"
    echo "Response: $QR"
fi

echo ""
echo "================================================"
echo "✅ PROCESSO COMPLETATO"
echo "================================================"
echo ""
echo "Istanza: ${INSTANCE_NAME}"
echo "API Key: ${API_KEY}"
echo ""
echo "Prova anche questi URL nel browser:"
echo "• http://37.27.89.35:8080/instance/qr/${INSTANCE_NAME}/image"
echo "• http://37.27.89.35:8080/instance/qrcode/base64/${INSTANCE_NAME}"
echo ""
