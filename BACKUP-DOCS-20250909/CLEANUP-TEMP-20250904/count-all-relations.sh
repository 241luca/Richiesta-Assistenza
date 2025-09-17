#!/bin/bash

echo "📊 CONTEGGIO TOTALE RELAZIONI NEL SISTEMA"
echo "========================================"

cd backend

echo "1. MODELLI PRINCIPALI NEL DATABASE:"
echo "-----------------------------------"
grep "^model " prisma/schema.prisma | wc -l
echo "modelli totali"
echo ""

echo "2. ALCUNI MODELLI IMPORTANTI:"
echo "-----------------------------"
grep "^model " prisma/schema.prisma | head -15 | sed 's/model /  - /'

echo ""
echo "3. RELAZIONI NEL MODELLO AssistanceRequest:"
echo "-------------------------------------------"
sed -n '/^model AssistanceRequest/,/^model /p' prisma/schema.prisma | grep -E "^\s+[a-zA-Z]" | grep -E "(User|Category|Subcategory|Quote|Message|Attachment)" | wc -l
echo "relazioni in AssistanceRequest"

echo ""
echo "4. RELAZIONI NEL MODELLO Quote:"
echo "-------------------------------"
sed -n '/^model Quote/,/^model /p' prisma/schema.prisma | grep -E "^\s+[a-zA-Z]" | grep -v "^\s+[a-z][a-zA-Z]*\s" | head -5

echo ""
echo "5. RELAZIONI NEL MODELLO User:"
echo "------------------------------"
sed -n '/^model User/,/^}/p' prisma/schema.prisma | grep -E "^\s+[A-Z]" | wc -l
echo "relazioni in User (questo modello ha TANTE relazioni!)"

echo ""
echo "========================================"
echo "RIASSUNTO:"
echo ""
echo "- Ogni modello ha le SUE relazioni"
echo "- AssistanceRequest ha 7 relazioni principali"
echo "- User probabilmente ne ha 20+"
echo "- Quote ne ha alcune sue"
echo "- E così via per tutti i modelli"
echo ""
echo "Noi stiamo sistemando prima AssistanceRequest"
echo "perché è quello usato nelle richieste"
