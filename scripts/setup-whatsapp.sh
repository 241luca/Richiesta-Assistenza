#!/bin/bash

# Script di configurazione WhatsApp Integration
# Uso: ./setup-whatsapp.sh

echo "========================================"
echo "🚀 CONFIGURAZIONE WHATSAPP INTEGRATION"
echo "========================================"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verifica che siamo nella directory corretta
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Errore: Esegui questo script dalla root del progetto${NC}"
    exit 1
fi

echo "📋 Controllo prerequisiti..."
echo ""

# Controlla Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js non installato${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js trovato: $(node -v)${NC}"
fi

# Controlla PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client non trovato (potrebbe essere ok se usi un DB remoto)${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL trovato${NC}"
fi

# Controlla Redis
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠️  Redis non trovato (opzionale ma consigliato)${NC}"
else
    echo -e "${GREEN}✅ Redis trovato${NC}"
fi

echo ""
echo "========================================"
echo "📝 CONFIGURAZIONE VARIABILI D'AMBIENTE"
echo "========================================"
echo ""

# Controlla se .env esiste
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  File .env non trovato. Creazione in corso...${NC}"
    cp .env.example .env 2>/dev/null || touch .env
fi

# Funzione per aggiungere o aggiornare variabile in .env
update_env() {
    key=$1
    value=$2
    
    if grep -q "^$key=" .env; then
        # La chiave esiste, aggiornala
        sed -i.bak "s|^$key=.*|$key=$value|" .env
    else
        # La chiave non esiste, aggiungila
        echo "$key=$value" >> .env
    fi
}

# Richiedi configurazioni WhatsApp
echo "Inserisci le tue credenziali SendApp Cloud:"
echo "(Registrati su https://app.sendapp.cloud se non hai un account)"
echo ""

read -p "SendApp Access Token (lascia vuoto per usare demo): " access_token
if [ -z "$access_token" ]; then
    access_token="64833dfa0xxxx"
    echo -e "${YELLOW}Usando token demo (funzionalità limitata)${NC}"
fi

read -p "Webhook URL (es: https://tuodominio.com): " webhook_url
if [ -z "$webhook_url" ]; then
    webhook_url="http://localhost:3200"
    echo -e "${YELLOW}Usando localhost (solo per sviluppo)${NC}"
fi

# Aggiorna .env
echo ""
echo "📝 Aggiornamento file .env..."

update_env "SENDAPP_BASE_URL" "https://app.sendapp.cloud/api"
update_env "SENDAPP_ACCESS_TOKEN" "$access_token"
update_env "SENDAPP_INSTANCE_ID" ""
update_env "SENDAPP_WEBHOOK_URL" "${webhook_url}/api/whatsapp/webhook"

# Richiedi OpenAI API Key se non presente
if ! grep -q "^OPENAI_API_KEY=" .env || [ "$(grep '^OPENAI_API_KEY=' .env | cut -d'=' -f2)" = "" ]; then
    echo ""
    echo "Per utilizzare l'AI Assistant serve una API Key di OpenAI"
    read -p "OpenAI API Key (lascia vuoto per saltare): " openai_key
    if [ -n "$openai_key" ]; then
        update_env "OPENAI_API_KEY" "$openai_key"
        echo -e "${GREEN}✅ OpenAI configurato${NC}"
    else
        echo -e "${YELLOW}⚠️  AI Assistant non sarà disponibile senza OpenAI API Key${NC}"
    fi
fi

echo ""
echo "========================================"
echo "🗄️ AGGIORNAMENTO DATABASE"
echo "========================================"
echo ""

cd backend

# Genera Prisma Client
echo "Generazione Prisma Client..."
npx prisma generate

# Applica migrazioni
echo "Applicazione migrazioni database..."
npx prisma db push

echo -e "${GREEN}✅ Database aggiornato${NC}"

cd ..

echo ""
echo "========================================"
echo "📦 INSTALLAZIONE DIPENDENZE"
echo "========================================"
echo ""

# Installa dipendenze se necessario
if [ ! -d "node_modules" ]; then
    echo "Installazione dipendenze frontend..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "Installazione dipendenze backend..."
    cd backend && npm install && cd ..
fi

echo ""
echo "========================================"
echo "✅ CONFIGURAZIONE COMPLETATA!"
echo "========================================"
echo ""
echo "Prossimi passi:"
echo ""
echo "1. Avvia il backend:"
echo "   ${GREEN}cd backend && npm run dev${NC}"
echo ""
echo "2. Avvia il frontend (in un altro terminale):"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "3. Configura WhatsApp:"
echo "   - Vai su ${GREEN}http://localhost:5193/admin/whatsapp/setup${NC}"
echo "   - Clicca su 'Inizializza WhatsApp'"
echo "   - Scansiona il QR Code con WhatsApp"
echo ""
echo "4. Testa il sistema:"
echo "   - Invia un messaggio al numero configurato"
echo "   - Controlla la dashboard su ${GREEN}http://localhost:5193/admin/whatsapp${NC}"
echo ""
echo "📚 Documentazione completa: ./docs/WHATSAPP-AI-KB-INTEGRATION.md"
echo ""
echo "========================================"
echo "🆘 SUPPORTO"
echo "========================================"
echo ""
echo "Problemi comuni:"
echo ""
echo "• QR Code non appare: Verifica l'access token SendApp"
echo "• AI non risponde: Aggiungi OpenAI API Key nel .env"
echo "• Webhook non funziona: Usa ngrok per esporre localhost"
echo ""
echo "Per aiuto: lucamambelli@lmtecnologie.it"
echo ""
