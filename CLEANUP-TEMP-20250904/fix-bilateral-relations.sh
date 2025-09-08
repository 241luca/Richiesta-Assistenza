#!/bin/bash

echo "🔧 FIX BILATERALE DELLE RELAZIONI"
echo "================================="

cd backend

echo "1. Ripristino schema dal backup:"
LATEST_BACKUP=$(ls -t prisma/schema.prisma.backup* | head -1)
cp "$LATEST_BACKUP" prisma/schema.prisma
echo "Ripristinato da: $LATEST_BACKUP"

echo ""
echo "2. Aggiungo @relation su ENTRAMBI I LATI:"

cat > /tmp/fix-bilateral.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// IMPORTANTE: Dobbiamo aggiungere @relation su ENTRAMBI i lati!

// 1. Category <-> AssistanceRequest
// Lato AssistanceRequest: Category -> category
schema = schema.replace(
  /(\s+)Category\s+Category\s+@relation\(fields: \[categoryId\], references: \[id\]\)/,
  '$1category Category @relation("request_category", fields: [categoryId], references: [id])'
);
// Lato Category: AssistanceRequest[] con stesso nome relazione
schema = schema.replace(
  /model Category \{([^}]+)AssistanceRequest\s+AssistanceRequest\[\]/s,
  'model Category {$1requests AssistanceRequest[] @relation("request_category")'
);

console.log('✅ Category <-> AssistanceRequest sistemato');

// Per ora facciamo solo questa per testare
// Se funziona, faremo le altre

fs.writeFileSync('prisma/schema.prisma', schema);
SCRIPT

node /tmp/fix-bilateral.js

echo ""
echo "3. Formattazione schema:"
npx prisma format

echo ""
echo "4. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "5. Test relazione category:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Test da AssistanceRequest
    await prisma.assistanceRequest.findFirst({
      include: {
        category: true  // minuscolo!
      }
    })
    console.log('✅ AssistanceRequest -> category funziona')
    
    // Test da Category
    await prisma.category.findFirst({
      include: {
        requests: true  // plurale!
      }
    })
    console.log('✅ Category -> requests funziona')
    
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

rm -f /tmp/fix-bilateral.js

echo ""
echo "================================="
echo "Se funziona, facciamo le altre 3 relazioni"
