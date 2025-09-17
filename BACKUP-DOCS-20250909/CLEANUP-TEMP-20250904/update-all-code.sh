#!/bin/bash

echo "🔄 AGGIORNIAMO TUTTO IL CODICE CON I NOMI MINUSCOLI"
echo "==================================================="

cd backend

echo "1. Fix request.routes.ts:"
sed -i '' 's/Category:/category:/g' src/routes/request.routes.ts
sed -i '' 's/Quote:/quotes:/g' src/routes/request.routes.ts
sed -i '' 's/Message:/messages:/g' src/routes/request.routes.ts
sed -i '' 's/RequestAttachment:/attachments:/g' src/routes/request.routes.ts
echo "✅ request.routes.ts"

echo "2. Fix quote.routes.ts:"
sed -i '' 's/Category:/category:/g' src/routes/quote.routes.ts
sed -i '' 's/AssistanceRequest:/request:/g' src/routes/quote.routes.ts
echo "✅ quote.routes.ts"

echo "3. Fix dashboard routes:"
find src/routes/dashboard -name "*.ts" -exec sed -i '' 's/Category:/category:/g' {} \;
find src/routes/dashboard -name "*.ts" -exec sed -i '' 's/Quote:/quotes:/g' {} \;
echo "✅ dashboard routes"

echo "4. Fix admin routes:"
find src/routes/admin -name "*.ts" -exec sed -i '' 's/Category:/category:/g' {} \;
echo "✅ admin routes"

echo "5. Fix services:"
find src/services -name "*.ts" -exec sed -i '' 's/Category:/category:/g' {} \;
find src/services -name "*.ts" -exec sed -i '' 's/Quote:/quotes:/g' {} \;
find src/services -name "*.ts" -exec sed -i '' 's/User:/user:/g' {} \;
echo "✅ services"

echo "6. Fix chat service specificamente:"
sed -i '' 's/User:/user:/g' src/services/chat.service.ts
echo "✅ chat.service.ts"

echo ""
echo "7. Test finale:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    await prisma.assistanceRequest.findMany({
      include: {
        client: true,
        professional: true,
        category: true,
        subcategory: true,
        quotes: true,
        messages: true,
        attachments: true
      }
    })
    console.log('✅ Query requests funziona!')
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "==================================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ora tutto AssistanceRequest usa nomi minuscoli puliti!"
