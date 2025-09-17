#!/bin/bash

# OTTIENI E MOSTRA IL QR CODE DI WHATSAPP

echo "📱 RECUPERO QR CODE WHATSAPP..."
echo "================================"

# Chiama l'API per ottenere il QR
RESPONSE=$(curl -s 'https://app.sendapp.cloud/api/get_qrcode?instance_id=68C67956807C8&access_token=68c575f3c2ff1')

# Estrai il base64 dal JSON
QR_BASE64=$(echo $RESPONSE | grep -o '"base64":"[^"]*' | cut -d'"' -f4)

# Se non c'è il QR, mostra errore
if [ -z "$QR_BASE64" ]; then
  echo "❌ ERRORE: Non riesco a ottenere il QR Code"
  echo "Risposta API: $RESPONSE"
  exit 1
fi

# Crea pagina HTML con il QR
cat > /Users/lucamambelli/Desktop/Richiesta-Assistenza/QR-WHATSAPP.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp QR Code</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #25D366;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
        }
        h1 {
            color: #25D366;
            margin-bottom: 20px;
        }
        img {
            width: 400px;
            height: 400px;
            border: 3px solid #25D366;
            padding: 10px;
            border-radius: 10px;
        }
        .info {
            margin-top: 20px;
            padding: 15px;
            background: #f0f0f0;
            border-radius: 10px;
        }
        .status {
            color: red;
            font-weight: bold;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 SCANSIONA QUESTO QR CODE</h1>
        <div class="status">⚠️ L'ISTANZA NON È ATTIVATA - SCANSIONA IL QR!</div>
        <img src="$QR_BASE64" alt="WhatsApp QR Code">
        <div class="info">
            <p><strong>Instance ID:</strong> 68C67956807C8</p>
            <p><strong>Token:</strong> 68c575f3c2ff1</p>
        </div>
        <div style="margin-top: 20px; text-align: left;">
            <h3>Come attivare:</h3>
            <ol>
                <li>Apri WhatsApp sul telefono</li>
                <li>Vai su Impostazioni → Dispositivi collegati</li>
                <li>Tocca "Collega un dispositivo"</li>
                <li>Scansiona questo QR Code</li>
            </ol>
        </div>
    </div>
</body>
</html>
EOF

echo "✅ QR Code salvato in: QR-WHATSAPP.html"
echo ""
echo "📱 APRO LA PAGINA NEL BROWSER..."
open /Users/lucamambelli/Desktop/Richiesta-Assistenza/QR-WHATSAPP.html

echo ""
echo "✅ FATTO! Scansiona il QR Code con WhatsApp"
