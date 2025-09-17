#!/bin/bash

echo "🔍 VERIFICA STATO NGROK"
echo "========================"
echo ""

# Controlla se ngrok è in esecuzione
if pgrep -x "ngrok" > /dev/null; then
    echo "✅ Ngrok è in esecuzione"
    echo ""
    
    # Controlla da quanto tempo
    NGROK_PID=$(pgrep -x "ngrok")
    echo "📊 Informazioni processo ngrok:"
    ps -p $NGROK_PID -o pid,etime,comm
    echo ""
    
    echo "⏱️  Se ngrok gira da più di 2-8 ore potrebbe essere scaduto!"
    echo ""
else
    echo "❌ Ngrok NON è in esecuzione!"
    echo ""
fi

echo "📡 Per verificare l'URL attuale:"
echo "   1. Vai su: http://localhost:4040"
echo "   2. Controlla l'URL mostrato"
echo "   3. Verifica se è lo stesso configurato su SendApp"
echo ""

echo "🔄 SE L'URL È CAMBIATO:"
echo "========================"
echo "1. RIAVVIA ngrok:"
echo "   killall ngrok"
echo "   ngrok http 3200"
echo ""
echo "2. PRENDI il nuovo URL da http://localhost:4040"
echo ""
echo "3. AGGIORNA su SendApp con il nuovo URL"
echo ""

echo "💡 ALTERNATIVE GRATUITE A NGROK:"
echo "================================="
echo ""
echo "1. LOCALTUNNEL (più stabile):"
echo "   npm install -g localtunnel"
echo "   lt --port 3200 --subdomain richiesta-assistenza"
echo "   URL fisso: https://richiesta-assistenza.loca.lt"
echo ""
echo "2. CLOUDFLARE TUNNEL (gratis, stabile):"
echo "   Richiede account Cloudflare"
echo "   brew install cloudflared"
echo "   cloudflared tunnel --url http://localhost:3200"
echo ""
echo "3. SERVEO (semplice):"
echo "   ssh -R 80:localhost:3200 serveo.net"
echo "   URL: https://[random].serveo.net"
echo ""
echo "4. WEBHOOK.SITE (per test):"
echo "   https://webhook.site"
echo "   Solo per verificare se SendApp invia"
