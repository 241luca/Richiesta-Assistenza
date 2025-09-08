#!/bin/bash

echo "🎯 AGGIUNGIAMO @relation A TUTTO PER NOMI PULITI"
echo "==============================================="

cd backend

echo "1. Backup schema attuale:"
cp prisma/schema.prisma prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)

echo ""
echo "2. Aggiungo @relation dove manca:"

cat > /tmp/add-all-relations.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// In AssistanceRequest, aggiungi @relation dove manca
// Category -> category
if (!schema.includes('category Category @relation')) {
  schema = schema.replace(
    /Category\s+Category\s+@relation\(fields: \[categoryId\], references: \[id\]\)/,
    'category Category @relation("request_category", fields: [categoryId], references: [id])'
  );
  console.log('✅ Category -> category');
}

// Quote -> quotes  
schema = schema.replace(/Quote\s+Quote\[\]/g, 'quotes Quote[] @relation("request_quotes")');
console.log('✅ Quote -> quotes');

// Message -> messages
schema = schema.replace(/Message\s+Message\[\]/g, 'messages Message[] @relation("request_messages")');
console.log('✅ Message -> messages');

// RequestAttachment -> attachments
schema = schema.replace(/RequestAttachment\s+RequestAttachment\[\]/g, 'attachments RequestAttachment[] @relation("request_attachments")');
console.log('✅ RequestAttachment -> attachments');

// User nei vari modelli
schema = schema.replace(/(?<!@relation.*)User\s+User\s+@relation\(fields/g, 'user User @relation("model_user", fields');
console.log('✅ User -> user dove manca');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('\n✅ Schema aggiornato con @relation ovunque!');
SCRIPT

node /tmp/add-all-relations.js

echo ""
echo "3. Rigenero Prisma Client:"
npx prisma generate

echo ""
echo "4. Test con i nomi puliti:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    await prisma.assistanceRequest.findFirst({
      include: {
        client: true,
        professional: true,
        category: true,
        subcategory: true,
        quotes: true,
        messages: true,
        attachments: true
      }
    })
    console.log('✅✅✅ FUNZIONA CON NOMI PULITI!')
    console.log('Ora possiamo usare ovunque:')
    console.log('- client, professional, category, subcategory')
    console.log('- quotes, messages, attachments')
    console.log('- user (invece di User)')
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

rm -f /tmp/add-all-relations.js

echo ""
echo "==============================================="
echo "Se funziona, ora aggiorniamo TUTTO il codice"
echo "per usare i nomi puliti minuscoli!"
