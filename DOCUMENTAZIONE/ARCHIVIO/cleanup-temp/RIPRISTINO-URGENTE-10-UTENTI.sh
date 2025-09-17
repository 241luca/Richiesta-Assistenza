#!/bin/bash

echo "🚨 RIPRISTINO URGENTE DATABASE - 10 UTENTI ORIGINALI"
echo "====================================================="

cd backend

npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function ripristinaUtentiOriginali() {
  try {
    console.log('\n🔥 RIPRISTINO COMPLETO 10 UTENTI ORIGINALI...\n')
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // TUTTI I 10 UTENTI DALLA LOGIN PAGE
    const utentiOriginali = [
      // AMMINISTRATORI (2)
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
      },
      
      // CLIENTI (4)
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
        email: 'maria.rossi@hotmail.it',
        username: 'maria.rossi',
        password: hashedPassword,
        firstName: 'Maria',
        lastName: 'Rossi',
        fullName: 'Maria Rossi',
        role: 'CLIENT',
        phone: '+39 333 5678901',
        address: 'Via Colosseo 10',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        emailVerified: true
      },
      {
        email: 'giuseppe.verdi@libero.it',
        username: 'giuseppe.verdi',
        password: hashedPassword,
        firstName: 'Giuseppe',
        lastName: 'Verdi',
        fullName: 'Giuseppe Verdi',
        role: 'CLIENT',
        phone: '+39 333 6789012',
        address: 'Via Po 15',
        city: 'Torino',
        province: 'TO',
        postalCode: '10100',
        emailVerified: true
      },
      {
        email: 'anna.ferrari@outlook.it',
        username: 'anna.ferrari',
        password: hashedPassword,
        firstName: 'Anna',
        lastName: 'Ferrari',
        fullName: 'Anna Ferrari',
        role: 'CLIENT',
        phone: '+39 333 7890123',
        address: 'Via Zamboni 20',
        city: 'Bologna',
        province: 'BO',
        postalCode: '40100',
        emailVerified: true
      },
      
      // PROFESSIONISTI (4)
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
        email: 'francesco.russo@assistenza.it',
        username: 'francesco.russo',
        password: hashedPassword,
        firstName: 'Francesco',
        lastName: 'Russo',
        fullName: 'Francesco Russo',
        role: 'PROFESSIONAL',
        phone: '+39 333 8901234',
        address: 'Via Duomo 25',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        profession: 'Elettricista',
        hourlyRate: 40.00,
        emailVerified: true
      },
      {
        email: 'paolo.costa@assistenza.it',
        username: 'paolo.costa',
        password: hashedPassword,
        firstName: 'Paolo',
        lastName: 'Costa',
        fullName: 'Paolo Costa',
        role: 'PROFESSIONAL',
        phone: '+39 333 9012345',
        address: 'Via Vesuvio 30',
        city: 'Napoli',
        province: 'NA',
        postalCode: '80100',
        profession: 'Tecnico Climatizzazione',
        hourlyRate: 45.00,
        emailVerified: true
      },
      {
        email: 'luca.moretti@assistenza.it',
        username: 'luca.moretti',
        password: hashedPassword,
        firstName: 'Luca',
        lastName: 'Moretti',
        fullName: 'Luca Moretti',
        role: 'PROFESSIONAL',
        phone: '+39 333 0123456',
        address: 'Corso Francia 40',
        city: 'Torino',
        province: 'TO',
        postalCode: '10100',
        profession: 'Falegname',
        hourlyRate: 38.00,
        emailVerified: true
      }
    ]
    
    console.log('📝 Creazione/ripristino dei 10 utenti originali...\n')
    
    for (const userData of utentiOriginali) {
      try {
        // Prova prima a vedere se esiste
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        })
        
        if (existingUser) {
          // Aggiorna per essere sicuri che sia tutto corretto
          await prisma.user.update({
            where: { email: userData.email },
            data: {
              ...userData,
              id: existingUser.id, // mantieni l'ID esistente
              updatedAt: new Date()
            }
          })
          console.log(`✅ Aggiornato: ${userData.fullName} (${userData.email})`)
        } else {
          // Crea nuovo utente
          await prisma.user.create({
            data: {
              id: uuidv4(),
              ...userData,
              updatedAt: new Date()
            }
          })
          console.log(`✅ Creato: ${userData.fullName} (${userData.email})`)
        }
      } catch (error) {
        console.error(`❌ Errore con ${userData.email}:`, error.message)
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 VERIFICA FINALE UTENTI:')
    console.log('='.repeat(60))
    
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        fullName: true,
        profession: true
      },
      orderBy: {
        role: 'asc'
      }
    })
    
    console.log(`\n✅ TOTALE UTENTI NEL DATABASE: ${allUsers.length}\n`)
    
    // Raggruppa per ruolo
    const byRole = {
      SUPER_ADMIN: allUsers.filter(u => u.role === 'SUPER_ADMIN'),
      ADMIN: allUsers.filter(u => u.role === 'ADMIN'),
      CLIENT: allUsers.filter(u => u.role === 'CLIENT'),
      PROFESSIONAL: allUsers.filter(u => u.role === 'PROFESSIONAL')
    }
    
    console.log('🛡️ SUPER ADMIN:', byRole.SUPER_ADMIN.length)
    byRole.SUPER_ADMIN.forEach(u => console.log(`   • ${u.email} - ${u.fullName}`))
    
    console.log('\n📋 ADMIN:', byRole.ADMIN.length)
    byRole.ADMIN.forEach(u => console.log(`   • ${u.email} - ${u.fullName}`))
    
    console.log('\n👤 CLIENTI:', byRole.CLIENT.length)
    byRole.CLIENT.forEach(u => console.log(`   • ${u.email} - ${u.fullName}`))
    
    console.log('\n🔧 PROFESSIONISTI:', byRole.PROFESSIONAL.length)
    byRole.PROFESSIONAL.forEach(u => console.log(`   • ${u.email} - ${u.fullName} (${u.profession})`))
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ RIPRISTINO COMPLETATO!')
    console.log('🔑 Password per tutti: password123')
    console.log('='.repeat(60))
    
  } catch (error) {
    console.error('❌ ERRORE CRITICO:', error)
  } finally {
    await prisma.$disconnect()
  }
}

ripristinaUtentiOriginali()
EOF

echo ""
echo "====================================================="
echo "✅ SCRIPT COMPLETATO - VERIFICARE OUTPUT SOPRA"
