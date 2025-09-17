#!/bin/bash

echo "🔧 FIX ERRORE SINTASSI SCHEMA"
echo "============================="

cd backend

echo "1. Controllo l'errore alla riga 685:"
sed -n '680,695p' prisma/schema.prisma

echo ""
echo "2. Sistemo l'errore di sintassi:"

# Fix: le righe sono finite fuori dal modello, dobbiamo rimetterle dentro
cat > /tmp/fix-syntax.js << 'SCRIPT'
const fs = require('fs');

let lines = fs.readFileSync('prisma/schema.prisma', 'utf8').split('\n');

// Trova la riga 684 che ha una } che chiude troppo presto
for (let i = 683; i < 695; i++) {
  if (lines[i] && lines[i].trim() === '}' && lines[i+1] && lines[i+1].includes('metadata')) {
    console.log(`Trovato problema alla riga ${i+1}: modello chiuso troppo presto`);
    
    // Rimuovi la } che chiude troppo presto
    lines.splice(i, 1);
    
    // Trova la prossima } solitaria e lasciala (quella è la vera chiusura)
    for (let j = i; j < i + 10; j++) {
      if (lines[j] && lines[j].trim() === '}') {
        console.log(`Mantengo la } di chiusura alla nuova posizione`);
        break;
      }
    }
    break;
  }
}

fs.writeFileSync('prisma/schema.prisma', lines.join('\n'));
console.log('✅ Sintassi corretta');
SCRIPT

node /tmp/fix-syntax.js

echo ""
echo "3. Verifica correzione:"
sed -n '680,695p' prisma/schema.prisma

echo ""
echo "4. Formattazione schema:"
npx prisma format

echo ""
echo "5. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "6. TEST FINALE:"
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
    console.log('✅✅✅ FUNZIONA CON: client, professional, category!')
    process.exit(0)
  } catch (e) {
    console.log('❌ Errore:', e.message)
    process.exit(1)
  }
}

test()
EOF

rm -f /tmp/fix-syntax.js

echo ""
echo "============================="
