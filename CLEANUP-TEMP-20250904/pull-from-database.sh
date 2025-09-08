#!/bin/bash

echo "🔄 RIPRISTINO SCHEMA DAL DATABASE ATTUALE"
echo "========================================"

cd backend

echo "1. Backup schema corrotto:"
mv prisma/schema.prisma prisma/schema.prisma.corrupted

echo ""
echo "2. Pull schema fresco dal database (con TUTTO incluso AI):"
npx prisma db pull --force

echo ""
echo "3. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "4. TEST quali nomi usa Prisma ORA:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  console.log('Test relazioni con schema attuale dal DB...\n')
  
  try {
    const req = await prisma.assistanceRequest.findFirst({
      include: { 
        User_AssistanceRequest_clientIdToUser: true,
        User_AssistanceRequest_professionalIdToUser: true,
        Category: true,
        Subcategory: true
      }
    })
    console.log('✅ I NOMI ATTUALI SONO:')
    console.log('   - User_AssistanceRequest_clientIdToUser')
    console.log('   - User_AssistanceRequest_professionalIdToUser') 
    console.log('   - Category')
    console.log('   - Subcategory')
    console.log('\nQuesti sono i nomi che DOBBIAMO usare nel codice!')
  } catch (e) {
    console.log('Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "========================================"
echo "ORA sistemiamo il codice per usare questi nomi!"
