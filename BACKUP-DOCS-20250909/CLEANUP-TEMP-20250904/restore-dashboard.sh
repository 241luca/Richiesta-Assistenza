#!/bin/bash
# Script per ripristinare la dashboard funzionante

echo "=== RIPRISTINO DASHBOARD FUNZIONANTE ==="
echo ""

cd /Users/lucamambelli/Desktop/richiesta-assistenza

# 1. Backup della versione attuale rotta
echo "1. Backup versione attuale..."
cp src/pages/DashboardPage.tsx src/pages/DashboardPage.backup-BROKEN-$(date +%Y%m%d-%H%M%S).tsx

# 2. Ripristino versione funzionante del 29 agosto
echo "2. Ripristino versione funzionante..."
cp src/pages/DashboardPage.backup-20250829094152.tsx src/pages/DashboardPage.tsx

echo ""
echo "✅ Dashboard ripristinata alla versione funzionante!"
echo "✅ La versione rotta è salvata come DashboardPage.backup-BROKEN-*.tsx"
echo ""
echo "🔄 Ora ricarica la pagina nel browser (F5)"
