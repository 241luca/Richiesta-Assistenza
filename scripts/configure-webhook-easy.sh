#!/bin/bash

# Script per configurare webhook WhatsApp SENZA ngrok
# Usage: ./configure-webhook-easy.sh

echo "🔧 Configurazione Webhook WhatsApp (Metodo Facile)"
echo "=================================================="
echo ""

# Colori
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 OPZIONI PER IL WEBHOOK:${NC}"
echo ""

echo -e "${GREEN}1. WEBHOOK.SITE (Consigliato - Nessuna installazione)${NC}"
echo "   ✅ Gratuito"
echo "   ✅ Nessuna registrazione"
echo "   ✅ Funziona subito"
echo "   ❌ URL cambia ogni volta"
echo ""
echo "   👉 Apri: https://webhook.site"
echo "   👉 Copia l'URL univoco che vedi (es: https://webhook.site/abc123...)"
echo "   👉 Usa questo URL nel sistema WhatsApp"
echo ""

echo -e "${YELLOW}2. LOCALHOST.RUN (Via SSH - Nessuna installazione)${NC}"
echo "   ✅ Gratuito"
echo "   ✅ Nessuna installazione"
echo "   ✅ Funziona via SSH"
echo ""
echo "   Esegui questo comando:"
echo -e "${BLUE}   ssh -R 80:localhost:3200 nokey@localhost.run${NC}"
echo ""

echo -e "${GREEN}3. BEECEPTOR (Mock Server)${NC}"
echo "   ✅ Gratuito (con limiti)"
echo "   ✅ Interfaccia web"
echo "   ✅ Logs dettagliati"
echo ""
echo "   👉 Vai su: https://beeceptor.com"
echo "   👉 Crea un endpoint gratuito"
echo "   👉 Usa l'URL generato"
echo ""

echo "=================================================="
echo ""
echo -e "${BLUE}📝 CONFIGURAZIONE NEL SISTEMA:${NC}"
echo ""
echo "1. Scegli uno dei metodi sopra"
echo "2. Ottieni l'URL pubblico"
echo "3. Aggiungi '/api/whatsapp/webhook' alla fine"
echo "   Esempio: https://webhook.site/abc123.../api/whatsapp/webhook"
echo "4. Vai su http://localhost:5193/admin/whatsapp"
echo "5. Inserisci l'URL completo nel campo webhook"
echo "6. Clicca 'Configura Webhook'"
echo ""

echo "=================================================="
echo ""
echo -e "${YELLOW}⚠️  NOTA PER PRODUZIONE:${NC}"
echo "In produzione dovrai:"
echo "- Avere un server con IP pubblico e HTTPS"
echo "- O usare servizi cloud (Heroku, AWS, etc.)"
echo "- O configurare port forwarding sul router"
echo ""

echo -e "${GREEN}🚀 METODO PIÙ VELOCE:${NC}"
echo "1. Apri https://webhook.site in un browser"
echo "2. Copia l'URL che vedi"
echo "3. Il webhook è pronto!"
echo ""

# Apri webhook.site automaticamente
echo "Vuoi aprire webhook.site nel browser? (s/n)"
read -r risposta
if [[ "$risposta" == "s" || "$risposta" == "S" ]]; then
    open https://webhook.site
    echo ""
    echo "✅ Browser aperto!"
    echo "📋 Copia l'URL che vedi e aggiungici: /api/whatsapp/webhook"
fi

echo ""
echo "✅ Guida completata!"
