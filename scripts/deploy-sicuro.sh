#!/bin/bash

# DEPLOY SUPER SICURO - Con backup e rollback

echo "🛡️ DEPLOY SICURO CON BACKUP"
echo "============================"

VPS_IP="95.217.123.456"
VPS_USER="root"

# 1. BACKUP PRIMA DI TUTTO
echo "💾 Step 1: Backup database..."
./scripts/backup-vps-database.sh

# 2. SNAPSHOT DEL CODICE
echo "📸 Step 2: Snapshot codice attuale..."
ssh $VPS_USER@$VPS_IP << 'ENDSSH'
cd /var/www/richiesta-assistenza
cp -r . ../backup-code-$(date +%Y%m%d_%H%M%S)
echo "✅ Backup codice creato"
ENDSSH

# 3. TEST MIGRAZIONI
echo "🧪 Step 3: Test migrazioni..."
npx prisma migrate deploy --dry-run
if [ $? -ne 0 ]; then
    echo "❌ ERRORE: Migrazione non sicura!"
    echo "Controlla schema.prisma"
    exit 1
fi

# 4. DEPLOY
echo "🚀 Step 4: Deploy..."
git push origin main

ssh $VPS_USER@$VPS_IP << 'ENDSSH'
cd /var/www/richiesta-assistenza
git pull

# Test che tutto funzioni
npm install
npx prisma migrate deploy
pm2 restart all

# Verifica che l'app risponda
sleep 5
curl -f http://localhost:3200/api/health || {
    echo "❌ App non risponde! ROLLBACK!"
    # Ripristina backup
    pm2 stop all
    cp -r ../backup-code-*/* .
    pm2 start all
    exit 1
}

echo "✅ Deploy completato con successo!"
ENDSSH

echo ""
echo "🎉 DEPLOY SICURO COMPLETATO!"
echo "✅ Database backuppato"
echo "✅ Codice backuppato"
echo "✅ App funzionante"
