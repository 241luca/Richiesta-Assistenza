#!/bin/bash

echo "🔍 ANALISI NOMI RELAZIONI NELLO SCHEMA PRISMA"
echo "============================================="

cd backend

echo "Verifica nomi esatti nello schema:"
echo ""

echo "1. Modello ProfessionalUserSubcategory:"
grep -A 5 "model ProfessionalUserSubcategory" prisma/schema.prisma | grep -E "Subcategory|User"

echo ""
echo "2. Modello Category:"
grep -A 10 "model Category {" prisma/schema.prisma | grep -E "Subcategory|AssistanceRequest|DepositRule"

echo ""
echo "3. Verifica se dobbiamo usare Subcategory o subcategory:"
grep "Subcategory\s*Subcategory" prisma/schema.prisma

echo ""
echo "============================================="
echo "Se vedi 'Subcategory Subcategory' significa che:"
echo "- Il campo si chiama Subcategory (con S maiuscola)"
echo "- Dobbiamo usare Subcategory: nei queries"
