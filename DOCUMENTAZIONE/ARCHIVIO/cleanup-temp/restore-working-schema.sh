#!/bin/bash

echo "🔧 RIPRISTINO SCHEMA E FIX CORRETTO"
echo "=================================="

cd backend

echo "1. Ripristino schema dal backup:"
LATEST_BACKUP=$(ls -t prisma/schema.prisma.backup* | head -1)
cp "$LATEST_BACKUP" prisma/schema.prisma
echo "Ripristinato da: $LATEST_BACKUP"

echo ""
echo "2. Formattazione schema per sistemare relazioni:"
npx prisma format

echo ""
echo "3. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "4. Test cosa funziona ORA:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const req = await prisma.assistanceRequest.findFirst({
      include: {
        client: true,
        professional: true,
        Category: true,
        subcategory: true
      }
    })
    console.log('✅ Funziona con i nomi attuali')
  } catch (e) {
    console.log('Test fallito:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "=================================="
echo "LASCIAMO LO SCHEMA COM'È"
echo "È meglio usare i nomi che già funzionano"
echo "piuttosto che romperlo ancora"
