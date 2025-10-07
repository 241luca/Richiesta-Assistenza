#!/bin/bash

echo "🔧 CONFIGURAZIONE NGROK AUTHTOKEN"
echo "================================="
echo ""
echo "1. Vai su: https://dashboard.ngrok.com/signup"
echo "2. Registrati (è gratuito)"
echo "3. Copia il token da: https://dashboard.ngrok.com/get-started/your-authtoken"
echo ""
echo "Il token sarà tipo: 2ABC123def456ghi789..."
echo ""
read -p "Incolla qui il tuo authtoken: " AUTHTOKEN

if [ -z "$AUTHTOKEN" ]; then
    echo "❌ Token non fornito!"
    exit 1
fi

echo ""
echo "Configurazione ngrok con il token..."
ngrok config add-authtoken $AUTHTOKEN

if [ $? -eq 0 ]; then
    echo "✅ Token configurato con successo!"
    echo ""
    echo "Ora avvio ngrok sulla porta 3200..."
    echo ""
    ngrok http 3200
else
    echo "❌ Errore nella configurazione del token"
fi
