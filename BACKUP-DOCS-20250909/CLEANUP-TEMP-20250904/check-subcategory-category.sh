#!/bin/bash

echo "🔍 CONTROLLO SOTTOCATEGORIE-CATEGORIA"
echo "===================================="

cd backend

echo "1. Test diretto del database:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Conta sottocategorie senza categoria
    const subcategoriesWithoutCategory = await prisma.subcategory.findMany({
      where: {
        categoryId: null
      }
    })
    console.log('Sottocategorie SENZA categoria:', subcategoriesWithoutCategory.length)
    
    // Conta sottocategorie con categoria
    const subcategoriesWithCategory = await prisma.subcategory.findMany({
      where: {
        categoryId: {
          not: null
        }
      },
      include: {
        category: true
      }
    })
    console.log('Sottocategorie CON categoria:', subcategoriesWithCategory.length)
    
    // Mostra alcune sottocategorie
    const samples = await prisma.subcategory.findMany({
      take: 3,
      include: {
        category: true
      }
    })
    
    console.log('\nEsempi:')
    samples.forEach(sub => {
      console.log(`- ${sub.name}: categoria = ${sub.category ? sub.category.name : 'NESSUNA!'}`);
    })
    
  } catch (e) {
    console.log('❌ Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "===================================="
