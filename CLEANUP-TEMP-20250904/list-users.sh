#!/bin/bash

echo "📊 Lista utenti nel database:"
echo "============================="

cd backend

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        emailVerified: true
      }
    })
    
    console.log(`\nTotale utenti: ${users.length}\n`)
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   Nome: ${user.fullName}`)
      console.log(`   Ruolo: ${user.role}`)
      console.log(`   Verificato: ${user.emailVerified ? 'Sì' : 'No'}`)
      console.log(`   ID: ${user.id}`)
      console.log('')
    })
  } catch (error) {
    console.error('Errore:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()
EOF
