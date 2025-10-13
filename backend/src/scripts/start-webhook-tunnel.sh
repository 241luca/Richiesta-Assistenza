#!/bin/bash

# Script per esporre il webhook con localtunnel (alternativa a ngrok)
# Usage: ./start-webhook-tunnel.sh

echo "🌐 Configurazione Tunnel per WhatsApp Webhook"
echo "============================================="
echo ""

# Verifica se localtunnel è installato
if ! command -v lt &> /dev/null; then
    echo "📦 Installazione localtunnel..."
    npm install -g localtunnel
    
    if [ $? -ne 0 ]; then
        echo "❌ Errore installazione localtunnel"
        echo "   Prova manualmente con: npm install -g localtunnel"
        exit 1
    fi
fi

echo "🚀 Avvio tunnel sulla porta 3200..."
echo ""
echo "⏳ Il tunnel genererà un URL pubblico per il webhook..."
echo ""

# Avvia localtunnel
lt --port 3200 --subdomain whatsapp-webhook-$(date +%s)

# Se localtunnel fallisce, prova con un servizio online
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Localtunnel non disponibile"
    echo ""
    echo "🔄 Alternative per esporre il webhook:"
    echo ""
    echo "1. Servizi Online (senza installazione):"
    echo "   📌 https://webhook.site - Crea un URL temporaneo"
    echo "   📌 https://requestbin.com - URL per test webhook"
    echo "   📌 https://beeceptor.com - Mock server gratuito"
    echo ""
    echo "2. Servizi con installazione:"
    echo "   📌 bore.pub - bore local 3200 --to bore.pub"
    echo "   📌 localhost.run - ssh -R 80:localhost:3200 nokey@localhost.run"
    echo ""
    echo "3. Per produzione:"
    echo "   📌 Usa un server pubblico con HTTPS"
    echo "   📌 Configura port forwarding sul router"
    echo "   📌 Usa un servizio cloud (AWS, Heroku, etc.)"
fi
