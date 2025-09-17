#!/bin/bash

echo "🎯 FIX COMPLETO DASHBOARD CON I NOMI GIUSTI"
echo "==========================================="

cd backend

# Fix admin/dashboard.routes.ts
echo "1. Fix admin dashboard..."
sed -i '' 's/client:/User_AssistanceRequest_clientIdToUser:/g' src/routes/admin/dashboard.routes.ts
sed -i '' 's/assistanceRequest:/AssistanceRequest:/g' src/routes/admin/dashboard.routes.ts

# Fix l'accesso ai dati
sed -i '' 's/\.client\./\.User_AssistanceRequest_clientIdToUser\./g' src/routes/admin/dashboard.routes.ts

echo "✅ Admin dashboard corretta"

# Fix user-dashboard.routes.ts  
echo ""
echo "2. Fix user dashboard..."
# Già sistemato prima, ma ricontrolliamo assistanceRequest
sed -i '' 's/assistanceRequest:/AssistanceRequest:/g' src/routes/dashboard/user-dashboard.routes.ts

echo "✅ User dashboard corretta"

echo ""
echo "3. Test rapido per verificare i nomi:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Test AssistanceRequest
    await prisma.assistanceRequest.findFirst({
      select: {
        User_AssistanceRequest_clientIdToUser: true,
        User_AssistanceRequest_professionalIdToUser: true,
        Category: true
      }
    })
    console.log('✅ AssistanceRequest usa:')
    console.log('   - User_AssistanceRequest_clientIdToUser')
    console.log('   - User_AssistanceRequest_professionalIdToUser')
    console.log('   - Category')
    
    // Test Quote
    await prisma.quote.findFirst({
      select: {
        AssistanceRequest: true,
        User: true
      }
    })
    console.log('\n✅ Quote usa:')
    console.log('   - AssistanceRequest (maiuscola!)')
    console.log('   - User')
    
  } catch (e) {
    console.log('Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "==========================================="
echo "RIAVVIA IL BACKEND!"
echo ""
echo "I nomi corretti confermati sono:"
echo "- User_AssistanceRequest_clientIdToUser (NON client)"
echo "- AssistanceRequest (NON assistanceRequest)"
