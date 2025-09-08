#!/bin/bash

echo "🔧 FIX FINALE: CHAT E SOTTOCATEGORIE"
echo "===================================="

cd backend

echo "1. Fix chat.service.ts (user -> User):"
sed -i '' 's/user: {/User: {/g' src/services/chat.service.ts

echo "✅ chat.service.ts corretto"

echo ""
echo "2. Fix tutti i services (user -> User):"
find src/services -name "*.ts" -exec sed -i '' 's/user: {/User: {/g' {} \;
find src/services -name "*.ts" -exec sed -i '' 's/user: true/User: true/g' {} \;

echo "✅ Tutti i services corretti"

echo ""
echo "3. Controllo subcategory routes:"
if [ -f src/routes/subcategory.routes.ts ]; then
    echo "Trovato subcategory.routes.ts, lo correggo..."
    sed -i '' 's/category:/Category:/g' src/routes/subcategory.routes.ts
else
    echo "Cerco file subcategory..."
    grep -r "api/subcategories" src/routes/ | head -3
fi

echo ""
echo "4. Test finale delle query problematiche:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  // Test chat messages
  try {
    await prisma.requestChatMessage.findFirst({
      include: {
        User: true
      }
    })
    console.log('✅ RequestChatMessage con User funziona')
  } catch (e) {
    console.log('❌ Errore chat:', e.message.split('\n')[0])
  }
  
  // Test subcategories  
  try {
    await prisma.subcategory.findMany({
      include: {
        Category: true
      }
    })
    console.log('✅ Subcategory con Category funziona')
  } catch (e) {
    console.log('❌ Errore subcategory:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "===================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ricorda sempre: User e Category con MAIUSCOLA!"
