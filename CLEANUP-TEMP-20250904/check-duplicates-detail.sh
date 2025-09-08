#!/bin/bash

echo "🔧 APPROCCIO MANUALE DI FIX"
echo "==========================="

cd backend

# Mostra esattamente le righe dei modelli duplicati per conferma
echo "📍 Prima occorrenza NotificationChannel (riga 673):"
sed -n '673,720p' prisma/schema.prisma | head -5

echo ""
echo "📍 Seconda occorrenza NotificationChannel (riga 914):"
sed -n '914,960p' prisma/schema.prisma | head -5

echo ""
echo "Se confermi che la seconda è il duplicato, procederò a rimuoverla manualmente."
