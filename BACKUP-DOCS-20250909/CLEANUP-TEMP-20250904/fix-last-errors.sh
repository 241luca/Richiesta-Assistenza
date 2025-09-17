#!/bin/bash

echo "🔧 FIX ULTIMI ERRORI RESIDUI"
echo "============================"

cd backend

echo "1. Fix category.service.ts (AssistanceRequest -> requests):"
sed -i '' 's/AssistanceRequest: true/requests: true/g' src/services/category.service.ts
echo "✅ category.service.ts"

echo ""
echo "2. Fix chat.service.ts (user -> User con maiuscola):"
sed -i '' 's/user: {/User: {/g' src/services/chat.service.ts
echo "✅ chat.service.ts"

echo ""
echo "3. Verifica cosa dovrebbe essere in RequestChatMessage:"
echo "Controllo lo schema per RequestChatMessage..."
grep -A5 "model RequestChatMessage" ../prisma/schema.prisma | head -10

echo ""
echo "4. Test delle relazioni problematiche:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  // Test Category count
  try {
    await prisma.category.findMany({
      include: {
        _count: {
          select: {
            Subcategory: true,
            requests: true,  // ora dovrebbe essere 'requests'
            DepositRule: true
          }
        }
      }
    })
    console.log('✅ Category count funziona')
  } catch (e) {
    console.log('❌ Category count:', e.message.split('\n')[0])
  }
  
  // Test RequestChatMessage
  try {
    await prisma.requestChatMessage.findFirst({
      include: {
        User: true  // probabilmente è User maiuscolo
      }
    })
    console.log('✅ RequestChatMessage con User funziona')
  } catch (e) {
    console.log('❌ RequestChatMessage:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "============================"
echo "RIAVVIA IL BACKEND!"
