#!/bin/bash

echo "🔍 DIAGNOSI COMPLETA ERRORI SUBCATEGORIES"
echo "=========================================="

cd backend

# Verifica esatta dell'errore nelle sottocategorie
echo "1. Verifica errore in subcategory.routes.ts:"
echo "---------------------------------------------"
grep -n "prisma.subcategory.findMany" src/routes/subcategory.routes.ts | head -5

echo ""
echo "2. Verifica include statements nel file:"
echo "----------------------------------------"
grep -B2 -A5 "include:" src/routes/subcategory.routes.ts | head -20

echo ""
echo "3. Verifica nomi nel Prisma Client generato:"
echo "--------------------------------------------"
echo "I nomi disponibili per Subcategory sono:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRelations() {
  try {
    // Test con un findFirst per vedere i campi disponibili
    const test = await prisma.subcategory.findFirst({
      include: {
        Category: true,
        SubcategoryAiSettings: true,
        AssistanceRequest: true,
        KbDocument: true,
        ProfessionalUserSubcategory: true
      }
    })
    
    console.log('Relazioni disponibili per Subcategory:')
    console.log('- Category')
    console.log('- SubcategoryAiSettings')  
    console.log('- AssistanceRequest')
    console.log('- KbDocument')
    console.log('- ProfessionalUserSubcategory')
    
  } catch (error) {
    console.error('Errore:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkRelations()
EOF

echo ""
echo "=========================================="
