#!/bin/bash

# Script per verificare se payment routes è registrato
echo "🔍 Verifica registrazione payment routes..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Cerca nel server.ts
echo "Cercando in server.ts..."
grep -n "payment" src/server.ts || echo "❌ payment non trovato in server.ts"

# Cerca import payment
echo ""
echo "Cercando import payment routes..."
grep -r "from.*payment\.routes" src/ || echo "❌ Import payment.routes non trovato"

# Cerca app.use payment
echo ""
echo "Cercando app.use payment..."
grep -r "app\.use.*payment" src/ || echo "❌ app.use payment non trovato"

# Lista tutte le routes registrate
echo ""
echo "Routes registrate in server.ts:"
grep "app.use('/api" src/server.ts | head -20
