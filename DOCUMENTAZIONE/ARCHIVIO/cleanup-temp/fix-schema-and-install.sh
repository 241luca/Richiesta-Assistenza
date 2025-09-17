#!/bin/bash

echo "🔧 FIX SCHEMA DUPLICATI E INSTALLAZIONE PRISMA"
echo "=============================================="

cd backend

echo "1. Cerco modelli duplicati nello schema:"
echo "----------------------------------------"
grep -n "^model NotificationChannel" prisma/schema.prisma
grep -n "^model NotificationTemplate" prisma/schema.prisma
grep -n "^model NotificationLog" prisma/schema.prisma

echo ""
echo "2. Rimuovo duplicati (manteniamo solo la prima occorrenza):"
echo "-----------------------------------------------------------"

# Crea backup
cp prisma/schema.prisma prisma/schema.prisma.backup-duplicates

# Script per rimuovere duplicati
cat > /tmp/remove-duplicates.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = schema.split('\n');

const modelsSeen = new Set();
let newLines = [];
let inModel = false;
let currentModel = '';
let skipModel = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('model ')) {
    const modelName = line.split(' ')[1];
    if (modelsSeen.has(modelName)) {
      console.log(`Rimuovo duplicato: ${modelName} alla riga ${i + 1}`);
      skipModel = true;
    } else {
      modelsSeen.add(modelName);
      skipModel = false;
    }
    inModel = true;
  }
  
  if (!skipModel) {
    newLines.push(line);
  }
  
  if (inModel && line === '}') {
    inModel = false;
    skipModel = false;
  }
}

fs.writeFileSync('prisma/schema.prisma', newLines.join('\n'));
console.log('✅ Duplicati rimossi');
SCRIPT

node /tmp/remove-duplicates.js

echo ""
echo "3. Installazione Prisma Client:"
echo "-------------------------------"
npm install @prisma/client

echo ""
echo "4. Rigenerazione Prisma Client:"
echo "-------------------------------"
npx prisma generate

echo ""
echo "5. Test finale:"
echo "--------------"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const test1 = await prisma.assistanceRequest.findFirst({
      include: {
        client: true,
        professional: true,
        category: true
      }
    })
    console.log('✅ FUNZIONA con: client, professional, category!')
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

# Cleanup
rm -f /tmp/remove-duplicates.js

echo ""
echo "=============================================="
echo "Se vedi ✅ FUNZIONA, i nomi corretti sono:"
echo "client, professional, category (minuscoli)"
