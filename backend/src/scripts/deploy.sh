#!/bin/bash

# ==========================================
# SCRIPT DEPLOY DOCKER
# ==========================================
# Deploy completo dell'applicazione su VPS
# ==========================================

set -e  # Esce se c'è un errore

echo "================================================"
echo "🚀 DEPLOY SISTEMA RICHIESTA ASSISTENZA"
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
    echo "   Copia .env.production.example e configuralo"
    exit 1
fi

echo "✅ Prerequisiti OK"
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
# BUILD IMMAGINI
# ==========================================
echo "🔨 Build immagini Docker..."
docker-compose build --no-cache

echo "✅ Immagini create"
echo ""

# ==========================================
# AVVIO SERVIZI
# ==========================================
echo "🚀 Avvio servizi..."
docker-compose up -d

echo "✅ Servizi avviati"
echo ""

# ==========================================
# ATTENDI AVVIO DATABASE
# ==========================================
echo "⏳ Attendo avvio database..."
sleep 10
echo "✅ Database pronto"
echo ""

# ==========================================
# ESEGUI MIGRAZIONI
# ==========================================
echo "📊 Esecuzione migrazioni database..."
docker-compose exec -T backend npx prisma migrate deploy
echo "✅ Migrazioni completate"
echo ""

# ==========================================
# SEED DATABASE (opzionale)
# ==========================================
read -p "Vuoi inserire dati di esempio? (s/n): " seed_db
if [ "$seed_db" = "s" ]; then
    echo "🌱 Inserimento dati di esempio..."
    docker-compose exec -T backend npm run prisma:seed
    echo "✅ Dati inseriti"
    echo ""
fi

# ==========================================
# VERIFICA STATO
# ==========================================
echo "🔍 Verifica stato container..."
docker-compose ps
echo ""

# ==========================================
# VERIFICA HEALTH
# ==========================================
echo "❤️  Verifica health services..."
sleep 5

# Backend
if curl -f http://localhost:3200/api/health > /dev/null 2>&1; then
    echo "✅ Backend: OK"
else
    echo "⚠️  Backend: NON risponde"
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
# LOGS
# ==========================================
echo "📋 Ultimi log:"
echo ""
docker-compose logs --tail=50

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
echo "📋 Comandi utili:"
echo "   Vedi log:        docker-compose logs -f"
echo "   Riavvia:         docker-compose restart"
echo "   Ferma:           docker-compose down"
echo "   Status:          docker-compose ps"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Configura il firewall per aprire le porte 80 e 443"
echo "   2. Configura il DNS per puntare al tuo VPS"
echo "   3. Installa certificato SSL con Let's Encrypt"
echo ""
echo "📱 Per WhatsApp:"
echo "   1. Vai su: http://TUO-IP/admin/whatsapp"
echo "   2. Genera QR Code"
echo "   3. Scansiona con WhatsApp"
echo ""
