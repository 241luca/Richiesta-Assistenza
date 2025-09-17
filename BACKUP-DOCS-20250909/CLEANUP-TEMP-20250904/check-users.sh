#!/bin/bash

# Script per verificare gli utenti nel database
echo "🔍 Verifica utenti nel database..."
echo "================================"

# Esegui query per vedere tutti gli utenti
cd backend
npx prisma db pull 2>/dev/null

echo -e "\n📊 Utenti presenti nel database:"
echo "--------------------------------"

# Query per listare gli utenti
cat << 'EOF' | npx tsx
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        fullName: true,
        emailVerified: true
      }
    })
    
    console.log('\n✅ Utenti trovati:', users.length)
    users.forEach(user => {
      console.log(`\n📧 Email: ${user.email}`)
      console.log(`   Ruolo: ${user.role}`)
      console.log(`   Nome: ${user.fullName}`)
      console.log(`   Verificato: ${user.emailVerified ? 'Sì' : 'No'}`)
    })
    
    // Verifica utenti specifici della LoginPage
    console.log('\n\n🔍 Verifica utenti LoginPage:')
    console.log('==============================')
    
    const loginPageUsers = [
      'admin@assistenza.it',
      'luigi.bianchi@gmail.com',
      'mario.rossi@assistenza.it',
      'staff@assistenza.it'
    ]
    
    for (const email of loginPageUsers) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { email: true, role: true }
      })
      
      if (user) {
        console.log(`✅ ${email} - TROVATO (${user.role})`)
      } else {
        console.log(`❌ ${email} - NON TROVATO`)
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
EOF

echo -e "\n================================"
echo "✅ Verifica completata"
