#!/bin/bash

echo "✅ FIX DEFINITIVO CON I NOMI CORRETTI DALLO SCHEMA"
echo "================================================="

cd backend

echo "I nomi corretti sono:"
echo "- client (minuscola)"
echo "- professional (minuscola)"
echo "- Category (MAIUSCOLA)"
echo "- subcategory (minuscola)"
echo ""

echo "1. Fix request.routes.ts..."
sed -i '' 's/User_AssistanceRequest_clientIdToUser/client/g' src/routes/request.routes.ts
sed -i '' 's/User_AssistanceRequest_professionalIdToUser/professional/g' src/routes/request.routes.ts
sed -i '' 's/Subcategory/subcategory/g' src/routes/request.routes.ts
# Category resta maiuscola

echo "✅ request.routes.ts corretto"

echo ""
echo "2. Fix dashboard routes..."
sed -i '' 's/User_AssistanceRequest_clientIdToUser/client/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/User_AssistanceRequest_professionalIdToUser/professional/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/Subcategory/subcategory/g' src/routes/dashboard/user-dashboard.routes.ts

sed -i '' 's/User_AssistanceRequest_clientIdToUser/client/g' src/routes/admin/dashboard.routes.ts
sed -i '' 's/User_AssistanceRequest_professionalIdToUser/professional/g' src/routes/admin/dashboard.routes.ts
sed -i '' 's/Subcategory/subcategory/g' src/routes/admin/dashboard.routes.ts

echo "✅ Dashboard routes corretti"

echo ""
echo "3. Fix quote.routes.ts..."
sed -i '' 's/User_AssistanceRequest_clientIdToUser/client/g' src/routes/quote.routes.ts
sed -i '' 's/User_AssistanceRequest_professionalIdToUser/professional/g' src/routes/quote.routes.ts
sed -i '' 's/Subcategory/subcategory/g' src/routes/quote.routes.ts

echo "✅ quote.routes.ts corretto"

echo ""
echo "4. Test finale:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const req = await prisma.assistanceRequest.findFirst({
      include: {
        client: true,
        professional: true,
        Category: true,
        subcategory: true
      }
    })
    console.log('✅✅✅ FUNZIONA!')
    console.log('I nomi da usare sono:')
    console.log('- client')
    console.log('- professional')
    console.log('- Category (maiuscola)')
    console.log('- subcategory (minuscola)')
  } catch (e) {
    console.log('❌ Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "================================================="
echo "RIAVVIA IL BACKEND!"
