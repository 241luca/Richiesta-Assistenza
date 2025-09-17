#!/bin/bash

echo "🔍 DEBUG ERRORE SOTTOCATEGORIE"
echo "=============================="

cd backend

echo "1. Cerco il file delle route sottocategorie:"
find src -name "*subcategor*.ts" -type f | grep -E "route|service"

echo ""
echo "2. Controllo cosa c'è nel file:"
if [ -f src/routes/subcategory.routes.ts ]; then
    echo "Errori nel file subcategory.routes.ts:"
    grep -n "includeAiSettings" src/routes/subcategory.routes.ts | head -5
    echo ""
    echo "Include statements:"
    grep -n "include:" src/routes/subcategory.routes.ts | head -10
fi

echo ""
echo "3. Test query subcategory:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const subcategories = await prisma.subcategory.findMany({
      where: {
        isActive: true
      },
      include: {
        category: true,
        SubcategoryAiSettings: true
      }
    })
    console.log('✅ Query base funziona, trovate', subcategories.length, 'sottocategorie')
  } catch (e) {
    console.log('❌ Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "=============================="
echo "Dimmi cosa mostra così possiamo sistemare l'errore specifico"
