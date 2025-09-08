#!/bin/bash

# ============================================
# Script: Audit System Check
# Descrizione: Verifica completa del sistema di Audit Log
# Data: 7 Gennaio 2025
# ============================================

echo "╔══════════════════════════════════════════════════════════╗"
echo "║         AUDIT LOG SYSTEM - VERIFICA IN CORSO...          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Vai nella directory backend
cd backend 2>/dev/null || cd ../backend 2>/dev/null || {
    echo "❌ Errore: Directory backend non trovata"
    exit 1
}

# Verifica che lo script TypeScript esista
if [ ! -f "scripts/audit-system-check.ts" ]; then
    echo "❌ Errore: Script audit-system-check.ts non trovato"
    echo "   Path cercato: $(pwd)/scripts/audit-system-check.ts"
    exit 1
fi

# Esegui lo script TypeScript
echo "🔍 Avvio verifica del sistema Audit Log..."
echo ""

npx ts-node scripts/audit-system-check.ts 2>&1

# Cattura l'exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Verifica completata con successo!"
else
    echo ""
    echo "⚠️ Verifica completata con avvisi o errori (exit code: $EXIT_CODE)"
fi

exit $EXIT_CODE
