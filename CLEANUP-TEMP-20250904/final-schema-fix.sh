#!/bin/bash

echo "🔧 FIX DEFINITIVO SCHEMA PRISMA"
echo "==============================="

cd backend

echo "1. Formattazione automatica schema per risolvere relazioni mancanti:"
echo "--------------------------------------------------------------------"
npx prisma format

echo ""
echo "2. Rigenerazione Prisma Client:"
echo "-------------------------------"
npx prisma generate

echo ""
echo "3. TEST DEFINITIVO:"
echo "------------------"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    console.log('Test con nomi semplici (client, professional, category)...')
    const test1 = await prisma.assistanceRequest.findFirst({
      include: {
        client: true,
        professional: true,
        category: true
      }
    })
    console.log('✅✅✅ FUNZIONA! I nomi corretti sono: client, professional, category')
  } catch (e) {
    console.log('❌ Non funziona con nomi semplici')
    console.log('Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "==============================="
echo "RISULTATO FINALE:"
echo "Se vedi ✅✅✅ allora i nomi sono: client, professional, category"
echo "E dobbiamo sistemare il codice per usare questi nomi"
