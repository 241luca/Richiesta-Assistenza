#!/bin/bash

echo "🔧 COMPLETIAMO LE ALTRE 3 RELAZIONI"
echo "==================================="

cd backend

echo "1. Aggiungo le altre 3 relazioni bilaterali:"

cat > /tmp/complete-relations.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 2. Quote <-> AssistanceRequest
// In AssistanceRequest: Quote[] -> quotes Quote[]
schema = schema.replace(
  /(\s+)Quote\s+Quote\[\]/,
  '$1quotes Quote[] @relation("request_quotes")'
);
// In Quote: AssistanceRequest -> request AssistanceRequest
schema = schema.replace(
  /model Quote \{([^}]+)AssistanceRequest\s+AssistanceRequest\s+@relation\(fields: \[requestId\], references: \[id\]\)/s,
  'model Quote {$1request AssistanceRequest @relation("request_quotes", fields: [requestId], references: [id])'
);

console.log('✅ Quote <-> AssistanceRequest sistemato');

// 3. Message <-> AssistanceRequest
// In AssistanceRequest: Message[] -> messages Message[]
schema = schema.replace(
  /(\s+)Message\s+Message\[\]/,
  '$1messages Message[] @relation("request_messages")'
);
// In Message: AssistanceRequest? -> request AssistanceRequest?
schema = schema.replace(
  /model Message \{([^}]+)AssistanceRequest\s+AssistanceRequest\?\s+@relation\(fields: \[requestId\], references: \[id\]\)/s,
  'model Message {$1request AssistanceRequest? @relation("request_messages", fields: [requestId], references: [id])'
);

console.log('✅ Message <-> AssistanceRequest sistemato');

// 4. RequestAttachment <-> AssistanceRequest
// In AssistanceRequest: RequestAttachment[] -> attachments RequestAttachment[]
schema = schema.replace(
  /(\s+)RequestAttachment\s+RequestAttachment\[\]/,
  '$1attachments RequestAttachment[] @relation("request_attachments")'
);
// In RequestAttachment: AssistanceRequest -> request AssistanceRequest
schema = schema.replace(
  /model RequestAttachment \{([^}]+)AssistanceRequest\s+AssistanceRequest\s+@relation\(fields: \[requestId\], references: \[id\]\)/s,
  'model RequestAttachment {$1request AssistanceRequest @relation("request_attachments", fields: [requestId], references: [id])'
);

console.log('✅ RequestAttachment <-> AssistanceRequest sistemato');

fs.writeFileSync('prisma/schema.prisma', schema);
SCRIPT

node /tmp/complete-relations.js

echo ""
echo "2. Formattazione schema:"
npx prisma format

echo ""
echo "3. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "4. Test COMPLETO con tutti i nomi minuscoli:"
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
        category: true,      // minuscolo!
        quotes: true,        // minuscolo plurale!
        messages: true,      // minuscolo plurale!
        attachments: true    // minuscolo plurale!
      }
    })
    console.log('✅✅✅ TUTTO FUNZIONA CON NOMI MINUSCOLI!')
    console.log('')
    console.log('Ora in AssistanceRequest usiamo:')
    console.log('- client, professional, subcategory, category')
    console.log('- quotes, messages, attachments')
    console.log('')
    console.log('TUTTO minuscolo e pulito!')
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

rm -f /tmp/complete-relations.js

echo ""
echo "==================================="
echo "ORA AGGIORNIAMO IL CODICE!"
