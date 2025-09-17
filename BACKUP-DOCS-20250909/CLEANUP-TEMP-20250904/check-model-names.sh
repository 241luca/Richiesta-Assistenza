#!/bin/bash

echo "🔍 VERIFICA NOMI ESATTI TABELLE"
echo "==============================="

cd backend

echo "1️⃣ Lista di tutti i modelli nel Prisma Client:"
echo "-----------------------------------------------"

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Mostra tutti i modelli disponibili
console.log('Modelli disponibili in Prisma Client:')
console.log('=====================================')

const models = Object.keys(prisma).filter(key => 
  !key.startsWith('$') && 
  !key.startsWith('_') && 
  typeof prisma[key] === 'object'
).sort()

models.forEach(model => {
  console.log(`- prisma.${model}`)
})

console.log('\n📋 Test modelli correlati a subcategory:')
console.log('=========================================')

// Prova vari nomi possibili
const testNames = [
  'subcategory',
  'Subcategory', 
  'professionalSubcategory',
  'ProfessionalSubcategory',
  'subCategory',
  'professionalSubcategories'
]

for (const name of testNames) {
  if (prisma[name]) {
    try {
      const count = await prisma[name].count()
      console.log(`✅ prisma.${name} esiste - ${count} record`)
    } catch (err) {
      console.log(`⚠️ prisma.${name} esiste ma errore: ${err.message}`)
    }
  }
}

console.log('\n📋 Test modelli correlati a notification:')
console.log('==========================================')

const notificationTests = [
  'notificationType',
  'NotificationType',
  'notificationTypes',
  'notification_type'
]

for (const name of notificationTests) {
  if (prisma[name]) {
    try {
      const count = await prisma[name].count()
      console.log(`✅ prisma.${name} esiste - ${count} record`)
    } catch (err) {
      console.log(`⚠️ prisma.${name} esiste ma errore: ${err.message}`)
    }
  }
}

await prisma.$disconnect()
EOF
