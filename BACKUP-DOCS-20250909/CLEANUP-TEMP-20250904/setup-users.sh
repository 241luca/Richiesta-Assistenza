#!/bin/bash

# Script per creare/aggiornare gli utenti nel database
echo "🔧 Creazione/Aggiornamento utenti nel database..."
echo "================================================"

cd backend

# Crea gli utenti se non esistono
cat << 'EOF' | npx tsx
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createMissingUsers() {
  try {
    console.log('🌱 Verifica e creazione utenti...\n')
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // Lista degli utenti da creare/verificare
    const usersToCreate = [
      {
        email: 'admin@assistenza.it',
        username: 'admin',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        fullName: 'Super Admin',
        role: 'SUPER_ADMIN',
        phone: '+39 333 1234567',
        address: 'Via Roma 1',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        emailVerified: true
      },
      {
        email: 'luigi.bianchi@gmail.com',
        username: 'luigi.bianchi',
        password: hashedPassword,
        firstName: 'Luigi',
        lastName: 'Bianchi',
        fullName: 'Luigi Bianchi',
        role: 'CLIENT',
        phone: '+39 333 3456789',
        address: 'Via Napoli 5',
        city: 'Napoli',
        province: 'NA',
        postalCode: '80100',
        emailVerified: true
      },
      {
        email: 'mario.rossi@assistenza.it',
        username: 'mario.rossi',
        password: hashedPassword,
        firstName: 'Mario',
        lastName: 'Rossi',
        fullName: 'Mario Rossi',
        role: 'PROFESSIONAL',
        phone: '+39 333 2345678',
        address: 'Via Milano 10',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        profession: 'Idraulico',
        hourlyRate: 35.00,
        emailVerified: true
      },
      {
        email: 'staff@assistenza.it',
        username: 'staff',
        password: hashedPassword,
        firstName: 'Staff',
        lastName: 'Assistenza',
        fullName: 'Staff Assistenza',
        role: 'ADMIN',
        phone: '+39 333 4567890',
        address: 'Via Staff 1',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        emailVerified: true
      }
    ]
    
    for (const userData of usersToCreate) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        })
        
        if (!existingUser) {
          console.log(`📝 Creazione utente ${userData.email}...`)
          const newUser = await prisma.user.create({
            data: userData
          })
          console.log(`✅ Utente ${userData.fullName} creato con successo`)
        } else {
          console.log(`✓ Utente ${userData.email} già esistente`)
          
          // Aggiorna il ruolo se necessario
          if (existingUser.role !== userData.role) {
            await prisma.user.update({
              where: { email: userData.email },
              data: { role: userData.role }
            })
            console.log(`   └─ Ruolo aggiornato a ${userData.role}`)
          }
        }
      } catch (error) {
        console.error(`❌ Errore creando ${userData.email}:`, error.message)
      }
    }
    
    console.log('\n✅ Tutti gli utenti sono stati verificati/creati')
    console.log('📋 Password per tutti: password123')
    
    // Verifica finale
    console.log('\n📊 Verifica finale utenti:')
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        fullName: true
      }
    })
    
    allUsers.forEach(user => {
      console.log(`  • ${user.email} - ${user.role} (${user.fullName})`)
    })
    
  } catch (error) {
    console.error('❌ Errore generale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMissingUsers()
EOF

echo -e "\n================================================"
echo "✅ Setup utenti completato!"
echo ""
echo "🔑 Credenziali di accesso:"
echo "  • admin@assistenza.it / password123 (Super Admin)"
echo "  • luigi.bianchi@gmail.com / password123 (Cliente)"
echo "  • mario.rossi@assistenza.it / password123 (Professionista)"
echo "  • staff@assistenza.it / password123 (Staff/Admin)"
