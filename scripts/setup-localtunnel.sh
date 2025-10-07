#!/bin/bash

echo "🔧 INSTALLAZIONE LOCALTUNNEL (Alternativa a ngrok)"
echo "=================================================="
echo ""
echo "Localtunnel è gratuito e non richiede registrazione!"
echo ""

# Installa localtunnel
echo "1️⃣ Installazione localtunnel..."
npm install -g localtunnel

if [ $? -ne 0 ]; then
    echo "❌ Errore installazione. Provo con sudo..."
    sudo npm install -g localtunnel
fi

echo ""
echo "2️⃣ Avvio tunnel sulla porta 3200..."
echo ""
echo "⚠️ IMPORTANTE: Ti darà un URL tipo: https://xxxxx.loca.lt"
echo "   La prima volta che lo apri nel browser, ti chiederà di cliccare un bottone per confermare."
echo ""

# Avvia localtunnel
lt --port 3200 --subdomain whatsapp-webhook-$(date +%s)

# Se vuoi un subdomain fisso (potrebbe non essere disponibile)
# lt --port 3200 --subdomain il-tuo-nome-unico
