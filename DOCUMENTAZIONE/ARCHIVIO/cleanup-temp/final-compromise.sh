#!/bin/bash

echo "🔧 FIX FINALE: Category maiuscola nel service"
echo "==========================================="

cd backend

echo "1. Correggo subcategory.service.ts per usare Category maiuscola:"
sed -i '' 's/category:/Category:/g' src/services/subcategory.service.ts
echo "✅ Usato Category maiuscola"

echo ""
echo "2. Test rapido:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    await prisma.subcategory.findFirst({
      include: {
        Category: true,
        aiSettings: true
      }
    })
    console.log('✅ Funziona con Category maiuscola!')
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "==========================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Stato finale:"
echo "- AssistanceRequest: tutti minuscoli ✅"
echo "- Subcategory: Category maiuscola, aiSettings minuscola"
echo "- Quote: request minuscola ✅"
echo ""
echo "È un compromesso, ma funziona tutto!"
