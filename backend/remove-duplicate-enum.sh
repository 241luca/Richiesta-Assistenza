#!/bin/bash

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "📦 Backup prima di rimuovere duplicato..."
cp prisma/schema.prisma "prisma/schema.prisma.backup4-$(date +%Y%m%d-%H%M%S)"

echo "🗑️  Rimozione enum ModuleCategory duplicato (righe 3252-3260)..."

# Prendo tutto fino alla riga 3251
head -n 3251 prisma/schema.prisma > prisma/schema.prisma.tmp

# Salto le righe 3252-3260 (l'enum duplicato) e aggiungo dal 3261 in poi
tail -n +3261 prisma/schema.prisma >> prisma/schema.prisma.tmp

# Sostituisco
mv prisma/schema.prisma.tmp prisma/schema.prisma

echo "✅ Enum duplicato rimosso!"
echo ""
echo "Prova ora: npx prisma validate"
