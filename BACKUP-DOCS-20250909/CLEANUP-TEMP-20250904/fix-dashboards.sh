#!/bin/bash

echo "🔧 FIX DASHBOARD E DASHBOARD ADMIN"
echo "=================================="

cd backend

# Backup dei file
cp src/routes/dashboard/user-dashboard.routes.ts src/routes/dashboard/user-dashboard.routes.ts.backup-fix
cp src/routes/dashboard/admin-dashboard.routes.ts src/routes/dashboard/admin-dashboard.routes.ts.backup-fix 2>/dev/null

echo "1. Verifico i nomi corretti delle relazioni nello schema attuale:"
echo "-----------------------------------------------------------------"

# Verifica cosa c'è realmente nello schema
grep -A5 "model AssistanceRequest" prisma/schema.prisma | grep "@relation"

echo ""
echo "2. Fix user-dashboard.routes.ts:"
echo "---------------------------------"

# Correggi user-dashboard.routes.ts con i nomi corretti
sed -i '' 's/assistanceRequest:/assistanceRequest:/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/AssistanceRequest:/assistanceRequest:/g' src/routes/dashboard/user-dashboard.routes.ts

# Se professional è definito come relation, lascialo così
# Se non lo è, cambialo nel nome corretto
echo "Verifico se 'professional' è corretto o deve essere cambiato..."

# Controllo se nello schema c'è "professional" o un nome diverso
if grep -q "professional.*User.*@relation" prisma/schema.prisma; then
    echo "✅ 'professional' è corretto nello schema"
else
    echo "⚠️ 'professional' potrebbe non essere corretto, verifico il nome esatto..."
    grep "User.*@relation.*Professional" prisma/schema.prisma
fi

echo ""
echo "3. Test rapido delle query dashboard:"
echo "--------------------------------------"

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testDashboard() {
  try {
    // Test query per CLIENT dashboard
    const testRequest = await prisma.assistanceRequest.findFirst({
      include: {
        professional: true,
        category: true
      }
    })
    console.log('✅ Query con professional e category funziona')
  } catch (e1) {
    console.log('❌ Errore con professional, provo altri nomi...')
    try {
      const testRequest2 = await prisma.assistanceRequest.findFirst({
        include: {
          User_AssistanceRequest_professionalIdToUser: true,
          Category: true
        }
      })
      console.log('✅ Funziona con: User_AssistanceRequest_professionalIdToUser e Category')
    } catch (e2) {
      console.log('Errore:', e2.message.split('\n')[0])
    }
  }
  
  await prisma.$disconnect()
}

testDashboard()
EOF

echo ""
echo "=================================="
echo "Ora correggo con i nomi giusti..."
