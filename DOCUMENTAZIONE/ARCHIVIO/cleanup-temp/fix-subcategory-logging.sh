#!/bin/bash

echo "🔧 FIX LOGGING ERRORI SOTTOCATEGORIE"
echo "===================================="

cd backend

echo "1. Aggiungo logging errori in subcategory.routes.ts:"
cat > /tmp/fix-error-logging.js << 'SCRIPT'
const fs = require('fs');

let content = fs.readFileSync('src/routes/subcategory.routes.ts', 'utf8');

// Sostituisci tutti i next(error) con logging migliore
content = content.replace(
  /catch \(error\) \{\s*next\(error\);\s*\}/g,
  `catch (error) {
      console.error('Subcategory route error:', error);
      logger.error('Subcategory route error:', error);
      next(error);
    }`
);

// Aggiungi import logger se non c'è
if (!content.includes("import { logger }")) {
  content = "import { logger } from '../utils/logger';\n" + content;
}

fs.writeFileSync('src/routes/subcategory.routes.ts', content);
console.log('✅ Logging aggiunto');
SCRIPT

node /tmp/fix-error-logging.js

echo ""
echo "2. Controllo se formatSubcategoryList ha problemi:"
grep -n "formatSubcategoryList" src/utils/responseFormatter.ts | head -5

echo ""
echo "3. Test diretto della funzione problematica:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const subcategories = await prisma.subcategory.findMany({
      where: {
        isActive: true
      },
      include: {
        category: true,
        SubcategoryAiSettings: true
      }
    })
    
    console.log('Query OK, trovate:', subcategories.length)
    
    // Prova ad accedere ai campi che potrebbero dare errore
    subcategories.forEach(sub => {
      if (!sub.category) {
        console.log('⚠️ Sottocategoria senza categoria:', sub.name);
      }
    })
    
  } catch (e) {
    console.log('❌ Errore:', e)
  }
  
  await prisma.$disconnect()
}

test()
EOF

rm -f /tmp/fix-error-logging.js

echo ""
echo "===================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ora dovremmo vedere l'errore reale"
