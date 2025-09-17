#!/bin/bash

echo "🔧 FIX MIRATO: SubcategoryAiSettings"
echo "===================================="

cd backend

echo "1. Controllo stato attuale della relazione:"
grep -n "SubcategoryAiSettings" prisma/schema.prisma | grep -E "Subcategory|aiSettings" | head -5

echo ""
echo "2. Fix mirato SOLO per SubcategoryAiSettings:"

cat > /tmp/fix-ai-settings-careful.js << 'SCRIPT'
const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
let modified = false;

// Cerca la riga in Subcategory che ha SubcategoryAiSettings
let lines = schema.split('\n');
let newLines = [];
let inSubcategory = false;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  if (line.includes('model Subcategory {')) {
    inSubcategory = true;
  } else if (inSubcategory && line.trim() === '}') {
    inSubcategory = false;
  }
  
  // Se siamo in Subcategory e troviamo SubcategoryAiSettings senza @relation
  if (inSubcategory && line.includes('SubcategoryAiSettings') && line.includes('SubcategoryAiSettings?')) {
    if (!line.includes('@relation')) {
      console.log('Trovato: ' + line.trim());
      line = line.replace(
        /(\s+)SubcategoryAiSettings\s+SubcategoryAiSettings\?/,
        '$1aiSettings SubcategoryAiSettings? @relation("subcategory_ai_settings")'
      );
      console.log('Cambiato in: ' + line.trim());
      modified = true;
    }
  }
  
  newLines.push(line);
}

if (modified) {
  fs.writeFileSync('prisma/schema.prisma', newLines.join('\n'));
  console.log('✅ Fix applicato');
} else {
  console.log('⚠️ Nessuna modifica necessaria');
}
SCRIPT

node /tmp/fix-ai-settings-careful.js

echo ""
echo "3. Formattazione schema:"
npx prisma format

echo ""
echo "4. Se funziona, generiamo il client:"
npx prisma generate && echo "✅ Client generato con successo!"

echo ""
echo "5. Test che funzioni:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Test base
    await prisma.subcategory.findFirst()
    console.log('✅ Subcategory funziona')
    
    // Test se aiSettings esiste
    const sub = await prisma.subcategory.findFirst({
      include: {
        aiSettings: true
      }
    }).catch(e => null);
    
    if (sub) {
      console.log('✅ aiSettings funziona!')
    } else {
      // Prova con SubcategoryAiSettings
      await prisma.subcategory.findFirst({
        include: {
          SubcategoryAiSettings: true
        }
      })
      console.log('✅ SubcategoryAiSettings funziona (maiuscolo)')
    }
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "6. Se tutto funziona, BACKUP:"
if [ $? -eq 0 ]; then
    cp prisma/schema.prisma prisma/schema.prisma.AIFIX-$(date +%Y%m%d-%H%M%S)
    echo "✅ BACKUP SALVATO!"
else
    echo "⚠️ Non faccio backup perché c'è un errore"
fi

rm -f /tmp/fix-ai-settings-careful.js

echo ""
echo "===================================="
