#!/bin/bash

echo "🔧 AGGIUNGIAMO @relation ALLE 4 MANCANTI IN AssistanceRequest"
echo "==========================================================="

cd backend

echo "1. Backup schema:"
cp prisma/schema.prisma prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)

echo ""
echo "2. Aggiungo @relation alle 4 relazioni mancanti:"

# Modifica lo schema per aggiungere @relation
cat > /tmp/add-4-relations.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// In AssistanceRequest, cambia:
// Category Category -> category Category @relation("request_category")
// Message Message[] -> messages Message[] @relation("request_messages")  
// Quote Quote[] -> quotes Quote[] @relation("request_quotes")
// RequestAttachment RequestAttachment[] -> attachments RequestAttachment[] @relation("request_attachments")

// Trova il modello AssistanceRequest e sostituisci
schema = schema.replace(
  /(\s+)Category\s+Category\s+@relation\(fields: \[categoryId\], references: \[id\]\)/,
  '$1category Category @relation("request_category", fields: [categoryId], references: [id])'
);

schema = schema.replace(
  /(\s+)Message\s+Message\[\]/,
  '$1messages Message[] @relation("request_messages")'
);

schema = schema.replace(
  /(\s+)Quote\s+Quote\[\]/,
  '$1quotes Quote[] @relation("request_quotes")'
);

schema = schema.replace(
  /(\s+)RequestAttachment\s+RequestAttachment\[\]/,
  '$1attachments RequestAttachment[] @relation("request_attachments")'
);

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('✅ Relazioni aggiunte in AssistanceRequest');
SCRIPT

node /tmp/add-4-relations.js

echo ""
echo "3. Formattazione schema:"
npx prisma format

echo ""
echo "4. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "5. Test con i nuovi nomi minuscoli:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    await prisma.assistanceRequest.findFirst({
      include: {
        client: true,
        professional: true,
        subcategory: true,
        category: true,      // ora minuscolo!
        quotes: true,        // ora minuscolo plurale!
        messages: true,      // ora minuscolo plurale!
        attachments: true    // ora minuscolo!
      }
    })
    console.log('✅✅✅ FUNZIONA!')
    console.log('Ora usiamo TUTTI nomi minuscoli:')
    console.log('- client, professional, subcategory, category')
    console.log('- quotes, messages, attachments')
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

rm -f /tmp/add-4-relations.js

echo ""
echo "==========================================================="
echo "Se funziona, ora aggiorniamo il codice delle richieste"
echo "per usare i nuovi nomi minuscoli!"
