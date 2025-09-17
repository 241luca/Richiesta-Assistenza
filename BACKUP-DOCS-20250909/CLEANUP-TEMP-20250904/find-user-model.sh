#!/bin/bash

echo "🔍 CERCA MODELLO USER NEL SCHEMA PRISMA"
echo "========================================"
echo ""

# Cerca il modello User nel file schema.prisma
grep -n "model User" /Users/lucamambelli/Desktop/richiesta-assistenza/backend/prisma/schema.prisma

echo ""
echo "Estraggo il modello User completo..."
echo ""

# Estrai il modello User (approssimativo - tra model User e il prossimo model)
sed -n '/^model User {/,/^model [A-Z]/p' /Users/lucamambelli/Desktop/richiesta-assistenza/backend/prisma/schema.prisma | head -100
