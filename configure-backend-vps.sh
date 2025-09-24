#!/bin/bash

# Script per configurare il backend con EvolutionAPI su VPS

echo "⚙️ CONFIGURAZIONE BACKEND PER VPS"
echo "================================="
echo ""

# Chiedi l'IP del VPS
read -p "Inserisci l'IP del tuo VPS: " VPS_IP

# Aggiorna il file .env del backend
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Backup del .env attuale
cp .env .env.backup-$(date +%Y%m%d-%H%M%S)

# Aggiorna le variabili Evolution
sed -i '' "s|EVOLUTION_API_URL=.*|EVOLUTION_API_URL=http://$VPS_IP:8080|" .env

echo ""
echo "✅ Configurazione aggiornata!"
echo ""
echo "Il backend ora userà EvolutionAPI su: http://$VPS_IP:8080"
echo ""
echo "Riavvia il backend per applicare le modifiche!"
