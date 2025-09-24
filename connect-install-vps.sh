#!/bin/bash

# ================================================
# CONNESSIONE E INSTALLAZIONE VPS
# Script semplificato per Luca
# ================================================

echo "🚀 INSTALLAZIONE EVOLUTIONAPI SU VPS"
echo "===================================="
echo ""

# Chiedi informazioni VPS
read -p "📍 Inserisci l'IP del tuo VPS: " VPS_IP
read -p "👤 Inserisci l'username SSH (default: root): " VPS_USER
VPS_USER=${VPS_USER:-root}

echo ""
echo "📋 Riepilogo:"
echo "   Server: $VPS_IP"
echo "   Utente: $VPS_USER"
echo ""
read -p "Corretto? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ]; then
    echo "Annullato"
    exit 1
fi

# Copia lo script sul VPS
echo ""
echo "📤 Carico lo script sul VPS..."
scp install-evolution-vps.sh $VPS_USER@$VPS_IP:/tmp/

# Connetti ed esegui
echo ""
echo "🔧 Connessione al VPS e installazione..."
echo "   Ti verrà chiesta la password del VPS"
echo ""

ssh $VPS_USER@$VPS_IP << 'ENDSSH'
echo "Connesso al VPS!"
cd /tmp
chmod +x install-evolution-vps.sh
sudo bash install-evolution-vps.sh
ENDSSH

# Salva configurazione
echo ""
echo "💾 Salvo configurazione locale..."
cat > vps-config.txt << EOF
VPS_IP=$VPS_IP
VPS_USER=$VPS_USER
EVOLUTION_URL=http://$VPS_IP:8080
API_KEY=evolution_secure_key_2025_luca_mambelli
EOF

echo ""
echo "✅ INSTALLAZIONE COMPLETATA!"
echo ""
echo "📱 ORA DEVI:"
echo "1. Aggiornare il file backend/.env con:"
echo "   EVOLUTION_API_URL=http://$VPS_IP:8080"
echo ""
echo "2. Riavviare il backend locale"
echo ""
echo "3. Andare su http://localhost:5193/admin/whatsapp"
echo ""
echo "4. Creare istanza e scansionare QR Code"
echo ""
echo "🌐 EvolutionAPI è raggiungibile su: http://$VPS_IP:8080"
echo ""
echo "Per vedere i log del VPS:"
echo "  ssh $VPS_USER@$VPS_IP 'cd /opt/evolution-api && ./logs.sh'"
