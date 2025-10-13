#!/bin/bash

# ==========================================
# SCRIPT DEPLOY CON GITHUB CONTAINER REGISTRY
# ==========================================
# Deploy usando immagini pre-compilate da GitHub
# Velocissimo: solo pull, nessun build!
# ==========================================

set -e  # Esce se c'è un errore

echo "================================================"
echo "🚀 DEPLOY DA GITHUB CONTAINER REGISTRY"
echo "================================================"
echo ""

# ==========================================
# VERIFICA PREREQUISITI
# ==========================================
echo "🔍 Verifica prerequisiti..."

# Verifica Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non installato! Esegui prima: ./scripts/clean-vps.sh"
    exit 1
fi

# Verifica Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose non installato! Esegui prima: ./scripts/clean-vps.sh"
    exit 1
fi

# Verifica file .env.production
if [ ! -f ".env.production" ]; then
    echo "❌ File .env.production non trovato!"
    echo "   Copia .env.production e configuralo"
    exit 1
fi

echo "✅ Prerequisiti OK"
echo ""

# ==========================================
# GITHUB TOKEN
# ==========================================
echo "🔑 Login GitHub Container Registry..."

# Se hai un token GitHub personalizzato, usalo
if [ -n "$GITHUB_TOKEN" ]; then
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u 241luca --password-stdin
else
    echo "⚠️  GITHUB_TOKEN non trovato"
    echo "   Le immagini pubbliche funzionano comunque"
    echo "   Per immagini private, crea un token:"
    echo "   https://github.com/settings/tokens"
fi

echo ""

# ==========================================
# BACKUP EVENTUALE
# ==========================================
if [ -d "volumes" ]; then
    echo "💾 Backup volumi esistenti..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    sudo tar -czf "backup_volumes_${timestamp}.tar.gz" volumes
    echo "✅ Backup creato: backup_volumes_${timestamp}.tar.gz"
    echo ""
fi

# ==========================================
# CARICA VARIABILI AMBIENTE
# ==========================================
echo "⚙️  Caricamento configurazione..."
export $(grep -v '^#' .env.production | xargs)
echo "✅ Configurazione caricata"
echo ""

# ==========================================
# PULL IMMAGINI DA GITHUB
# ==========================================
echo "📥 Download immagini da GitHub..."
docker-compose -f docker-compose.prod.yml pull

echo "✅ Immagini scaricate"
echo ""

# ==========================================
# STOP VECCHI CONTAINER (se esistono)
# ==========================================
if [ "$(docker ps -q -f name=assistenza)" ]; then
    echo "🛑 Fermo container vecchi..."
    docker-compose -f docker-compose.prod.yml down
    echo "✅ Container fermati"
    echo ""
fi

# ==========================================
# AVVIO SERVIZI
# ==========================================
echo "🚀 Avvio servizi..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Servizi avviati"
echo ""

# ==========================================
# ATTENDI AVVIO DATABASE
# ==========================================
echo "⏳ Attendo avvio database..."
sleep 15
echo "✅ Database pronto"
echo ""

# ==========================================
# ESEGUI MIGRAZIONI
# ==========================================
echo "📊 Esecuzione migrazioni database..."
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

echo "✅ Migrazioni completate"
echo ""

# ==========================================
# SEED DATABASE (opzionale)
# ==========================================
read -p "Vuoi inserire dati di esempio? (s/n): " seed_db
if [ "$seed_db" = "s" ]; then
    echo "🌱 Inserimento dati di esempio..."
    docker-compose -f docker-compose.prod.yml exec -T backend npm run prisma:seed
    echo "✅ Dati inseriti"
    echo ""
fi

# ==========================================
# VERIFICA STATO
# ==========================================
echo "🔍 Verifica stato container..."
docker-compose -f docker-compose.prod.yml ps
echo ""

# ==========================================
# VERIFICA HEALTH
# ==========================================
echo "❤️  Verifica health services..."
sleep 10

# Backend
if curl -f http://localhost:3200/api/health > /dev/null 2>&1; then
    echo "✅ Backend: OK"
else
    echo "⚠️  Backend: NON risponde (attendi altri 10 secondi...)"
fi

# Frontend
if curl -f http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend: OK"
else
    echo "⚠️  Frontend: NON risponde"
fi

# WhatsApp
if curl -f http://localhost:3201/health > /dev/null 2>&1; then
    echo "✅ WhatsApp: OK"
else
    echo "⚠️  WhatsApp: NON risponde"
fi

echo ""

# ==========================================
# PULIZIA IMMAGINI VECCHIE
# ==========================================
echo "🧹 Pulizia immagini vecchie..."
docker image prune -f
echo "✅ Pulizia completata"
echo ""

# ==========================================
# LOGS
# ==========================================
echo "📋 Ultimi log:"
echo ""
docker-compose -f docker-compose.prod.yml logs --tail=30

# ==========================================
# INFORMAZIONI FINALI
# ==========================================
echo ""
echo "================================================"
echo "✅ DEPLOY COMPLETATO!"
echo "================================================"
echo ""
echo "🌐 URLs disponibili:"
echo "   Frontend:  http://$(hostname -I | awk '{print $1}')"
echo "   Backend:   http://$(hostname -I | awk '{print $1}'):3200"
echo "   WhatsApp:  http://$(hostname -I | awk '{print $1}'):3201"
echo ""
echo "🔄 Comandi utili:"
echo "   Vedi log:        docker-compose -f docker-compose.prod.yml logs -f"
echo "   Riavvia:         docker-compose -f docker-compose.prod.yml restart"
echo "   Ferma:           docker-compose -f docker-compose.prod.yml down"
echo "   Status:          docker-compose -f docker-compose.prod.yml ps"
echo "   Update:          ./scripts/update.sh"
echo ""
echo "📱 Per WhatsApp:"
echo "   1. Vai su: http://TUO-IP/admin/whatsapp"
echo "   2. Genera QR Code"
echo "   3. Scansiona con WhatsApp"
echo ""
echo "🔑 Per API Keys:"
echo "   Admin → Settings → API Keys"
echo "   (Google Maps, OpenAI, Stripe, ecc.)"
echo ""
