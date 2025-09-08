#!/bin/bash

echo "🔄 AGGIORNAMENTO DASHBOARD CON NUOVE RELAZIONI"
echo "=============================================="

cd backend

echo "1. Fix admin dashboard routes:"
echo "------------------------------"
# In admin dashboard, cambiamo i nomi vecchi con i nuovi
sed -i '' 's/Category:/category:/g' src/routes/admin/dashboard.routes.ts
sed -i '' 's/Quote:/quotes:/g' src/routes/admin/dashboard.routes.ts
sed -i '' 's/Message:/messages:/g' src/routes/admin/dashboard.routes.ts
sed -i '' 's/RequestAttachment:/attachments:/g' src/routes/admin/dashboard.routes.ts
echo "✅ admin/dashboard.routes.ts"

echo ""
echo "2. Fix user dashboard routes:"
echo "-----------------------------"
sed -i '' 's/Category:/category:/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/Quote:/quotes:/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/Message:/messages:/g' src/routes/dashboard/user-dashboard.routes.ts
sed -i '' 's/RequestAttachment:/attachments:/g' src/routes/dashboard/user-dashboard.routes.ts
echo "✅ dashboard/user-dashboard.routes.ts"

echo ""
echo "3. Fix professional dashboard (se esiste):"
echo "------------------------------------------"
if [ -f src/routes/dashboard/professional-dashboard.routes.ts ]; then
    sed -i '' 's/Category:/category:/g' src/routes/dashboard/professional-dashboard.routes.ts
    sed -i '' 's/Quote:/quotes:/g' src/routes/dashboard/professional-dashboard.routes.ts
    echo "✅ professional-dashboard.routes.ts"
else
    echo "⚠️ professional-dashboard.routes.ts non trovato"
fi

echo ""
echo "4. Verifica generale in tutti i file dashboard:"
echo "-----------------------------------------------"
find src/routes -name "*dashboard*.ts" -exec grep -l "Category:\|Quote:\|Message:\|RequestAttachment:" {} \; | while read file; do
    echo "   Aggiornamento: $file"
    sed -i '' 's/Category:/category:/g' "$file"
    sed -i '' 's/Quote:/quotes:/g' "$file"
    sed -i '' 's/Message:/messages:/g' "$file"
    sed -i '' 's/RequestAttachment:/attachments:/g' "$file"
done

echo ""
echo "5. Test dashboard queries:"
echo "--------------------------"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    // Test query tipica dashboard
    const requests = await prisma.assistanceRequest.findMany({
      include: {
        client: true,
        professional: true,
        category: true,
        subcategory: true,
        quotes: {
          include: {
            QuoteItem: true
          }
        }
      },
      take: 5
    })
    console.log('✅ Query dashboard funziona!')
    console.log(`   Trovate ${requests.length} richieste`)
  } catch (e) {
    console.log('❌ Errore dashboard:', e.message.split('\n')[0])
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "=============================================="
echo "✅ DASHBOARD AGGIORNATE!"
echo ""
echo "RIAVVIA IL BACKEND e prova:"
echo "- Dashboard Admin"
echo "- Dashboard User"
echo "- Lista Richieste"
echo "- Chat nelle richieste"
