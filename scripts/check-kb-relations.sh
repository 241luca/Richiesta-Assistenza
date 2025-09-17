#!/bin/bash

echo "🔍 Controllo relazioni nello schema..."

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo ""
echo "1️⃣ Cercando relazioni KnowledgeBaseConfig nel modello Subcategory:"
grep -n "KnowledgeBaseConfig" prisma/schema.prisma | grep -v "model KnowledgeBaseConfig"

echo ""
echo "2️⃣ Cercando relazioni knowledgeBase nel modello Subcategory:"
grep -n "knowledgeBase" prisma/schema.prisma | head -5

echo ""
echo "3️⃣ Modello KnowledgeBaseConfig (ultime righe):"
grep -A 5 "model KnowledgeBaseConfig {" prisma/schema.prisma | tail -10

echo ""
echo "4️⃣ Relazioni nel modello User per KB:"
grep -n "KnowledgeBase" prisma/schema.prisma | grep "User" -A 2 -B 2

echo ""
echo "✅ Fine controllo"
