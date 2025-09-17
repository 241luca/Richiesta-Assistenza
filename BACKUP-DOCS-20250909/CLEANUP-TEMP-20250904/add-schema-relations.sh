#!/bin/bash

echo "🎯 AGGIUNGIAMO @relation ALLO SCHEMA PER NOMI PULITI"
echo "==================================================="

cd backend

echo "1. Backup schema attuale:"
cp prisma/schema.prisma prisma/schema.prisma.backup-before-relation

echo ""
echo "2. Aggiungo @relation per avere nomi puliti:"

cat > /tmp/add-relations.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Trova il modello AssistanceRequest e aggiungi @relation
schema = schema.replace(
  /User_AssistanceRequest_clientIdToUser\s+User\s+@relation\("AssistanceRequest_clientIdToUser", fields: \[clientId\], references: \[id\]\)/,
  'client User @relation("AssistanceRequest_clientIdToUser", fields: [clientId], references: [id])'
);

schema = schema.replace(
  /User_AssistanceRequest_professionalIdToUser\s+User\?\s+@relation\("AssistanceRequest_professionalIdToUser", fields: \[professionalId\], references: \[id\]\)/,
  'professional User? @relation("AssistanceRequest_professionalIdToUser", fields: [professionalId], references: [id])'
);

// Aggiungi relazioni più pulite per Category e Subcategory se non ci sono già
if (!schema.includes('category Category')) {
  schema = schema.replace(
    /Category\s+Category\?/,
    'category Category?'
  );
}

if (!schema.includes('subcategory Subcategory')) {
  schema = schema.replace(
    /Subcategory\s+Subcategory\?/,
    'subcategory Subcategory?'
  );
}

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('✅ Relazioni aggiunte');
SCRIPT

node /tmp/add-relations.js

echo ""
echo "3. Rigenero Prisma Client:"
npx prisma generate

echo ""
echo "4. Test con i nuovi nomi puliti:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const req = await prisma.assistanceRequest.findFirst({
      include: {
        client: true,
        professional: true,
        category: true,
        subcategory: true
      }
    })
    console.log('✅✅✅ FUNZIONA CON NOMI PULITI!')
    console.log('Ora possiamo usare:')
    console.log('- client (invece di User_AssistanceRequest_clientIdToUser)')
    console.log('- professional (invece di User_AssistanceRequest_professionalIdToUser)')
    console.log('- category')
    console.log('- subcategory')
  } catch (e) {
    console.log('❌ Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

rm -f /tmp/add-relations.js

echo ""
echo "==================================================="
echo "Se vedi ✅✅✅ allora ora dobbiamo aggiornare tutto il codice"
echo "per usare i nomi puliti: client, professional, category, subcategory"
