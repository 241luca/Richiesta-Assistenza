#!/bin/bash
# Confronta la dashboard attuale con il backup funzionante

echo "=== CONFRONTO DASHBOARD ==="
echo ""
echo "File attuale: DashboardPage.tsx"
echo "Backup funzionante: DashboardPage.backup-20250829094152.tsx (29 agosto ore 09:41)"
echo ""
echo "Differenze trovate:"
echo "=================="

cd /Users/lucamambelli/Desktop/richiesta-assistenza/src/pages
diff -u DashboardPage.backup-20250829094152.tsx DashboardPage.tsx | head -100

echo ""
echo "Per ripristinare il backup funzionante:"
echo "cp DashboardPage.backup-20250829094152.tsx DashboardPage.tsx"
