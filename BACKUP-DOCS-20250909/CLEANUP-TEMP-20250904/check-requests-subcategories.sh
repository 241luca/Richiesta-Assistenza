#!/bin/bash

echo "🔍 VERIFICA ERRORI RICHIESTE E SOTTOCATEGORIE"
echo "============================================="

cd backend

echo "1. Controllo request.routes.ts:"
echo "--------------------------------"
grep -n "include:" src/routes/request.routes.ts | head -5
echo ""
grep -n "client\|professional\|Category\|subcategory" src/routes/request.routes.ts | head -10

echo ""
echo "2. Controllo subcategory routes (se esiste):"
echo "--------------------------------------------"
if [ -f src/routes/subcategory.routes.ts ]; then
    grep -n "include:" src/routes/subcategory.routes.ts | head -5
else
    echo "File subcategory.routes.ts non trovato"
    echo "Cerco altri file con subcategory..."
    find src -name "*subcategor*.ts" -type f
fi

echo ""
echo "3. Test diretto delle query:"
echo "----------------------------"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  // Test richieste
  try {
    await prisma.assistanceRequest.findMany({
      include: {
        client: true,
        professional: true,
        Category: true,
        subcategory: true
      }
    })
    console.log('✅ Query richieste funziona')
  } catch (e) {
    console.log('❌ Errore richieste:', e.message.split('\n')[0])
  }
  
  // Test sottocategorie
  try {
    await prisma.subcategory.findMany({
      include: {
        Category: true
      }
    })
    console.log('✅ Query sottocategorie funziona')
  } catch (e) {
    console.log('❌ Errore sottocategorie:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "============================================="
echo "Dimmi cosa mostra e quale errore specifico vedi nel log"
