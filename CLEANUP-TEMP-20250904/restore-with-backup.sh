#!/bin/bash

echo "📋 STRATEGIA CORRETTA CON BACKUP"
echo "================================"

cd backend

echo "1. Ripristino uno schema funzionante:"
# Prendi un backup prima del disastro
GOOD_BACKUP=$(ls -t prisma/schema.prisma.backup-20250901-23[0-3]* 2>/dev/null | head -1)
if [ -z "$GOOD_BACKUP" ]; then
    GOOD_BACKUP=$(ls -t prisma/schema.prisma.backup* | tail -1)
fi

cp "$GOOD_BACKUP" prisma/schema.prisma
echo "Ripristinato da: $GOOD_BACKUP"

echo ""
echo "2. Formatto lo schema:"
npx prisma format

echo ""
echo "3. Genero il client:"
npx prisma generate

echo ""
echo "4. BACKUP POST-RIPRISTINO:"
cp prisma/schema.prisma prisma/schema.prisma.WORKING-$(date +%Y%m%d-%H%M%S)
echo "✅ Backup salvato!"

echo ""
echo "5. Test che funzioni:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const user = await prisma.user.findFirst()
    const request = await prisma.assistanceRequest.findFirst()
    console.log('✅ Schema funzionante!')
  } catch (e) {
    console.log('❌ Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "================================"
echo "PROCEDURA CORRETTA:"
echo "1. Fix piccolo e mirato"
echo "2. Test che funzioni"
echo "3. BACKUP con nome descrittivo"
echo "4. Prossimo fix"
