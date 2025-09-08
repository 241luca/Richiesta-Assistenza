#!/bin/bash
# Backup prima di aggiungere la distanza

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "=== BACKUP PRIMA DI AGGIUNGERE DISTANZA ==="
echo ""

# Backup delle pagine che modificheremo
cp src/pages/RequestsPage.tsx src/pages/RequestsPage.backup-$(date +%Y%m%d-%H%M%S).tsx
cp src/pages/DashboardPage.tsx src/pages/DashboardPage.backup-working-$(date +%Y%m%d-%H%M%S).tsx

echo "✅ Backup creati"
echo ""
ls -la src/pages/*.backup-*tsx | tail -5
