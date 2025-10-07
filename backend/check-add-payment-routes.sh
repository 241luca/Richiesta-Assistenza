#!/bin/bash

# Script per aggiungere payment routes al server.ts
echo "🔍 Verifico se payment routes è già registrato..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Verifica se già esiste
if grep -q "paymentRoutes" src/server.ts; then
    echo "✅ Payment routes già presente nel server.ts"
else
    echo "❌ Payment routes NON presente, lo aggiungo..."
    
    # Trova la riga con quote routes e aggiungi payment dopo
    if grep -q "/api/quotes" src/server.ts; then
        echo "Trovato quotes, aggiungo payment routes dopo..."
        
        # Backup
        cp src/server.ts src/server.ts.backup-payment-$(date +%Y%m%d-%H%M%S)
        
        # Aggiungi import (dopo altri import di routes)
        # Questo è complesso da fare con sed, usiamo un approccio diverso
        echo "Aggiunta manuale necessaria..."
    fi
fi

echo ""
echo "Cerco pattern di routes nel server.ts:"
grep -n "app.use('/api/" src/server.ts | head -20
