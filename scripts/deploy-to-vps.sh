#!/bin/bash

# DEPLOY FACILE - Dal Mac al VPS in 1 comando!

echo "🚀 DEPLOY AUTOMATICO SU VPS"
echo "============================"

# Configurazione
VPS_IP="95.217.123.456"  # Metti IP del tuo VPS
VPS_USER="root"
APP_PATH="/var/www/richiesta-assistenza"

# 1. Commit locale
echo "📦 Preparazione modifiche..."
git add .
git commit -m "Update: $(date '+%Y-%m-%d %H:%M')"

# 2. Push su GitHub
echo "📤 Invio a GitHub..."
git push origin main

# 3. Aggiorna VPS
echo "🖥️ Aggiornamento VPS..."
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
cd /var/www/richiesta-assistenza
echo "📥 Download aggiornamenti..."
git pull origin main

echo "📦 Installazione dipendenze..."
npm install
cd backend && npm install

echo "🗄️ Aggiornamento database..."
npx prisma generate
npx prisma db push

echo "🔄 Riavvio applicazione..."
pm2 restart all

echo "✅ Deploy completato!"
ENDSSH

echo ""
echo "🎉 APP AGGIORNATA SUL VPS!"
echo "🌐 Visita: http://$VPS_IP"
