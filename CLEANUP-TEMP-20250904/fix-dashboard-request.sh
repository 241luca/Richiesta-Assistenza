#!/bin/bash

echo "🔧 FIX FINALE: AssistanceRequest -> request"
echo "=========================================="

cd backend

echo "1. Fix nelle dashboard (AssistanceRequest -> request):"
sed -i '' 's/AssistanceRequest:/request:/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/AssistanceRequest:/request:/g' src/routes/admin/dashboard.routes.ts
echo "✅ Dashboard corrette"

echo ""
echo "2. Cerca altri file con AssistanceRequest:"
grep -r "AssistanceRequest:" src/routes/ | grep -v "model\|@relation" | head -5

echo ""
echo "3. Fix generale in tutti i route files:"
find src/routes -name "*.ts" -exec sed -i '' 's/AssistanceRequest:/request:/g' {} \;
echo "✅ Tutti i routes corretti"

echo ""
echo "4. Test finale dashboard:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Test Quote con request (non AssistanceRequest)
    const quote = await prisma.quote.findFirst({
      include: {
        request: {
          select: {
            title: true
          }
        }
      }
    })
    console.log('✅ Quote -> request funziona')
  } catch (e) {
    console.log('❌ Errore:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "=========================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "Ora le dashboard dovrebbero funzionare!"
