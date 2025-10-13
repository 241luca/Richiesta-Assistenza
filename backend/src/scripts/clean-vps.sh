#!/bin/bash

# ==========================================
# SCRIPT PULIZIA VPS
# ==========================================
# Questo script pulisce il VPS e prepara per Docker
# ⚠️ ATTENZIONE: Cancellerà TUTTO sul VPS!
# ==========================================

set -e  # Esce se c'è un errore

echo "================================================"
echo "🧹 PULIZIA COMPLETA VPS"
echo "================================================"
echo ""
echo "⚠️  ATTENZIONE: Questo script cancellerà:"
echo "  - Tutti i container Docker"
echo "  - Tutte le immagini Docker"
echo "  - Tutti i volumi Docker"
echo "  - File non di sistema"
echo ""
read -p "Sei SICURO di voler procedere? (scrivi 'SI' per confermare): " conferma

if [ "$conferma" != "SI" ]; then
    echo "❌ Operazione annullata"
    exit 1
fi

echo ""
echo "🚀 Inizio pulizia..."
echo ""

# ==========================================
# 1. FERMA TUTTI I CONTAINER
# ==========================================
echo "📦 Fermando container Docker..."
if [ "$(docker ps -q)" ]; then
    docker stop $(docker ps -aq)
    echo "✅ Container fermati"
else
    echo "ℹ️  Nessun container in esecuzione"
fi

# ==========================================
# 2. RIMUOVI CONTAINER
# ==========================================
echo ""
echo "🗑️  Rimuovendo container..."
if [ "$(docker ps -aq)" ]; then
    docker rm $(docker ps -aq)
    echo "✅ Container rimossi"
else
    echo "ℹ️  Nessun container da rimuovere"
fi

# ==========================================
# 3. RIMUOVI IMMAGINI
# ==========================================
echo ""
echo "🖼️  Rimuovendo immagini Docker..."
if [ "$(docker images -q)" ]; then
    docker rmi -f $(docker images -q)
    echo "✅ Immagini rimosse"
else
    echo "ℹ️  Nessuna immagine da rimuovere"
fi

# ==========================================
# 4. RIMUOVI VOLUMI
# ==========================================
echo ""
echo "💾 Rimuovendo volumi Docker..."
if [ "$(docker volume ls -q)" ]; then
    docker volume rm $(docker volume ls -q)
    echo "✅ Volumi rimossi"
else
    echo "ℹ️  Nessun volume da rimuovere"
fi

# ==========================================
# 5. RIMUOVI NETWORK
# ==========================================
echo ""
echo "🌐 Rimuovendo network Docker..."
docker network prune -f
echo "✅ Network rimossi"

# ==========================================
# 6. PULIZIA SISTEMA DOCKER
# ==========================================
echo ""
echo "🧼 Pulizia completa Docker..."
docker system prune -af --volumes
echo "✅ Sistema Docker pulito"

# ==========================================
# 7. AGGIORNA SISTEMA
# ==========================================
echo ""
echo "📦 Aggiornamento sistema..."
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get autoremove -y
sudo apt-get autoclean -y
echo "✅ Sistema aggiornato"

# ==========================================
# 8. VERIFICA DOCKER
# ==========================================
echo ""
echo "🔍 Verifica installazione Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non installato! Installazione..."
    
    # Installa Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    
    echo "✅ Docker installato"
else
    echo "✅ Docker già installato"
fi

# ==========================================
# 9. VERIFICA DOCKER COMPOSE
# ==========================================
echo ""
echo "🔍 Verifica Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose non installato! Installazione..."
    
    # Installa Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo "✅ Docker Compose installato"
else
    echo "✅ Docker Compose già installato"
fi

# ==========================================
# 10. SPAZIO DISCO
# ==========================================
echo ""
echo "💽 Spazio disco disponibile:"
df -h / | tail -1

# ==========================================
# COMPLETATO
# ==========================================
echo ""
echo "================================================"
echo "✅ PULIZIA COMPLETATA!"
echo "================================================"
echo ""
echo "📋 Prossimi passi:"
echo "1. Carica il progetto sul VPS"
echo "2. Configura il file .env.production"
echo "3. Esegui: ./deploy.sh"
echo ""
echo "⚠️  IMPORTANTE: Se hai installato Docker ora,"
echo "   esegui 'logout' e poi riconnettiti per attivarlo"
echo ""
