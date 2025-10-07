#!/bin/bash

# Script super semplice per vedere e fixare i duplicati
# Data: 28/09/2025

echo "========================================="
echo "ANALISI E FIX MANUALE DUPLICATI"
echo "========================================="

# 1. Mostra dove sono i problemi
echo "📍 POSIZIONE DEI DUPLICATI:"
echo ""

echo "Linee con 'PaymentReconciliation' nel modello User:"
grep -n "PaymentReconciliation" prisma/schema.prisma | grep -A2 -B2 "model User"

echo ""
echo "Linee con 'Subscription' nel modello User:"
grep -n "Subscription" prisma/schema.prisma | grep -A2 -B2 "model User"

echo ""
echo "========================================="
echo "ISTRUZIONI MANUALI:"
echo "========================================="
echo ""
echo "1. Apri il file schema.prisma in un editor:"
echo "   nano prisma/schema.prisma"
echo ""
echo "2. Vai alla riga 1844 (circa) e cerca le righe duplicate:"
echo "   - Cerca 'PaymentReconciliation' che appare 2 volte"
echo "   - Cerca 'Subscription' che appare 2 volte"
echo ""
echo "3. Cancella la SECONDA occorrenza di ogni riga duplicata"
echo ""
echo "4. Salva il file (Ctrl+O, Enter, Ctrl+X in nano)"
echo ""
echo "5. Poi esegui:"
echo "   npx prisma format"
echo "   npx prisma generate"
echo "   npx prisma migrate dev --name payment-system"
echo ""
echo "========================================="
echo ""
echo "Vuoi che apra automaticamente l'editor? (y/n)"
read -r response

if [[ "$response" == "y" ]]; then
    # Prova ad aprire con l'editor disponibile
    if command -v code &> /dev/null; then
        code prisma/schema.prisma
        echo "✅ Aperto in VS Code"
    elif command -v nano &> /dev/null; then
        nano +1844 prisma/schema.prisma
    else
        vi +1844 prisma/schema.prisma
    fi
fi