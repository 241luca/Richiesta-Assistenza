#!/bin/bash

echo "🔄 RIGENERAZIONE PRISMA CLIENT CON NOMI CORRETTI"
echo "==============================================="

cd backend

echo "1. Pulizia cache Prisma:"
echo "------------------------"
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

echo "✅ Cache pulita"

echo ""
echo "2. Rigenerazione Prisma Client:"
echo "-------------------------------"
npx prisma generate

echo ""
echo "3. Verifica nomi generati:"
echo "--------------------------"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Test con i nomi semplici che DOVREBBERO funzionare
    const test1 = await prisma.assistanceRequest.findFirst({
      include: {
        client: true,
        professional: true,
        category: true
      }
    })
    console.log('✅ FUNZIONA con: client, professional, category')
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "==============================================="
echo "Se vedi ✅ FUNZIONA, allora dobbiamo sistemare"
echo "il codice per usare i nomi semplici!"
