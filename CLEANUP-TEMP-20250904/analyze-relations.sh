#!/bin/bash

echo "🔍 ANALISI RELAZIONI NELLO SCHEMA"
echo "================================="

cd backend

echo "1. Relazioni con @relation (nomi personalizzati):"
echo "-------------------------------------------------"
grep "@relation" prisma/schema.prisma | grep -v "//" | head -10

echo ""
echo "2. Relazioni SENZA @relation (nomi automatici):"
echo "-----------------------------------------------"
grep -E "^\s+(User|Category|Subcategory|Quote|Message)" prisma/schema.prisma | grep -v "@relation" | head -10

echo ""
echo "3. Riepilogo modello AssistanceRequest:"
echo "---------------------------------------"
sed -n '/^model AssistanceRequest/,/^model /p' prisma/schema.prisma | grep -E "^\s+[A-Z]" | head -15

echo ""
echo "================================="
echo "REGOLA:"
echo "- Con @relation: usa il nome personalizzato (es: client, professional)"
echo "- Senza @relation: usa il nome del modello con MAIUSCOLA (es: User, Category)"
