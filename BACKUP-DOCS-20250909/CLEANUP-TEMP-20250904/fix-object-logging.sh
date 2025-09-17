#!/bin/bash

echo "🔍 CERCO ERRORI [object Object]"
echo "==============================="

cd backend

echo "1. Cerco dove viene loggato [object Object]:"
grep -n "\[object Object\]" src --include="*.ts" -r | head -10

echo ""
echo "2. Cerco logger.error senza messaggio corretto:"
grep -n "logger.error(" src --include="*.ts" -r | grep -v "logger.error('" | head -10

echo ""
echo "3. Fix logging errato:"
cat > /tmp/fix-logging.js << 'SCRIPT'
const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix logger.error con oggetto diretto
  if (content.includes('logger.error(error)')) {
    content = content.replace(
      /logger\.error\(error\)/g,
      "logger.error('Error:', error)"
    );
    modified = true;
  }
  
  if (content.includes('logger.error(err)')) {
    content = content.replace(
      /logger\.error\(err\)/g,  
      "logger.error('Error:', err)"
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log('✅ Fixed:', path.basename(filePath));
  }
}

// Fix professionals.routes.ts
fixFile('src/routes/professionals.routes.ts');
fixFile('src/routes/user-subcategories.routes.ts');
SCRIPT

node /tmp/fix-logging.js
rm -f /tmp/fix-logging.js

echo ""
echo "4. Test rapido per trovare l'errore reale:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const subcats = await prisma.professionalUserSubcategory.findMany({
      where: {
        userId: '348ba304-26ff-4c43-9fa7-6ea7b414d67b',
        isActive: true
      },
      include: {
        Subcategory: {
          include: {
            category: true,
            aiSettings: true
          }
        }
      }
    })
    
    console.log('✅ Query funziona, trovate:', subcats.length, 'sottocategorie')
    
  } catch (e) {
    console.log('❌ Errore reale:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "==============================="
echo "RIAVVIA IL BACKEND!"
