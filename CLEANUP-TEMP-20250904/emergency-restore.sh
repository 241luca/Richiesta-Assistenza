#!/bin/bash

echo "🚨 RIPRISTINO URGENTE SCHEMA"
echo "============================"

cd backend

echo "1. Cerco un backup funzionante:"
ls -lht prisma/schema.prisma.backup* | head -5

echo ""
echo "2. Ripristino dal backup più recente PRIMA del disastro:"
# Trova un backup di prima delle 23:40
GOOD_BACKUP=$(ls -t prisma/schema.prisma.backup* | grep -v "2344\|2345" | head -1)

if [ -z "$GOOD_BACKUP" ]; then
    echo "❌ Nessun backup trovato, prendo il più vecchio disponibile"
    GOOD_BACKUP=$(ls -t prisma/schema.prisma.backup* | tail -1)
fi

echo "Ripristino da: $GOOD_BACKUP"
cp "$GOOD_BACKUP" prisma/schema.prisma

echo ""
echo "3. Verifica che lo schema sia valido:"
npx prisma format

echo ""
echo "4. Generazione Prisma Client:"
npx prisma generate

echo ""
echo "5. Test base:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    await prisma.user.findFirst()
    console.log('✅ Schema ripristinato e funzionante')
  } catch (e) {
    console.log('❌ Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

test()
EOF

echo ""
echo "============================"
echo "SCHEMA RIPRISTINATO!"
echo "Ora usiamo lo schema così com'è"
echo "senza toccare più niente!"
