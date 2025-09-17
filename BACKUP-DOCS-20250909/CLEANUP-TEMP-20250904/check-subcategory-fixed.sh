#!/bin/bash

echo "🔍 CONTROLLO SOTTOCATEGORIE-CATEGORIA (CORRETTO)"
echo "=============================================="

cd backend

echo "1. Test diretto del database:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Prendi TUTTE le sottocategorie
    const allSubcategories = await prisma.subcategory.findMany({
      include: {
        category: true
      }
    })
    
    console.log('Totale sottocategorie:', allSubcategories.length)
    
    // Conta quante hanno categoria e quante no
    const withCategory = allSubcategories.filter(s => s.category !== null)
    const withoutCategory = allSubcategories.filter(s => s.category === null)
    
    console.log('CON categoria:', withCategory.length)
    console.log('SENZA categoria:', withoutCategory.length)
    
    if (withoutCategory.length > 0) {
      console.log('\n⚠️ PROBLEMA: Ci sono sottocategorie senza categoria!')
      console.log('Prime 5 senza categoria:')
      withoutCategory.slice(0, 5).forEach(sub => {
        console.log(`  - ${sub.name} (categoryId: ${sub.categoryId})`);
      })
    }
    
    console.log('\nPrime 3 CON categoria:')
    withCategory.slice(0, 3).forEach(sub => {
      console.log(`  - ${sub.name} -> ${sub.category.name}`);
    })
    
  } catch (e) {
    console.log('❌ Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "=============================================="
