#!/bin/bash

echo "🔍 RICERCA MODELLI NELLO SCHEMA"
echo "================================"

cd backend

echo "Cerco il modello Category:"
grep -n "^model Category" prisma/schema.prisma

echo ""
echo "Contenuto del modello Category (10 righe):"
awk '/^model Category {/,/^}/' prisma/schema.prisma | head -15

echo ""
echo "================================"
echo "Cerco il modello ProfessionalUserSubcategory:"
grep -n "^model ProfessionalUserSubcategory" prisma/schema.prisma

echo ""
echo "Contenuto del modello (10 righe):"
awk '/^model ProfessionalUserSubcategory {/,/^}/' prisma/schema.prisma | head -15
