#!/bin/bash

# Setup LocalTunnel con URL FISSO
# Alternativa stabile a ngrok

echo "🚀 SETUP LOCALTUNNEL - Alternativa a ngrok"
echo "=========================================="
echo ""

# Controlla se localtunnel è installato
if ! command -v lt &> /dev/null; then
    echo "📦 Installazione LocalTunnel..."
    npm install -g localtunnel
fi

echo "✅ LocalTunnel installato"
echo ""

# Configurazione
SUBDOMAIN="richiesta-assistenza"
PORT=3200
URL="https://$SUBDOMAIN.loca.lt"

echo "📡 Avvio tunnel con URL FISSO:"
echo "   URL: $URL"
echo "   Porta: $PORT"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. La prima volta ti chiederà di aprire un link nel browser"
echo "   2. Inserisci la password mostrata"
echo "   3. Poi funzionerà sempre!"
echo ""
echo "📌 Configura questo webhook su SendApp/Evolution:"
echo "   $URL/api/whatsapp/webhook"
echo ""
echo "Avvio tunnel in 3 secondi..."
sleep 3

# Avvia localtunnel
lt --port $PORT --subdomain $SUBDOMAIN
