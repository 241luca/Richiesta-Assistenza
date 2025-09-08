import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function fixUtentiConFirstName() {
  console.log('\n🔧 FIX DEFINITIVO UTENTI CON firstName\n')
  console.log('='.repeat(60))
  
  try {
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // UTENTI CON firstName E lastName ESTRATTI DAL fullName
    const utenti = [
      {
        email: 'admin@assistenza.it',
        password: hashedPassword,
        fullName: 'Super Admin',
        firstName: 'Super',
        lastName: 'Admin',
        username: 'admin',
        role: 'SUPER_ADMIN'
      },
      {
        email: 'staff@assistenza.it',
        password: hashedPassword,
        fullName: 'Staff Assistenza',
        firstName: 'Staff',
        lastName: 'Assistenza',
        username: 'staff',
        role: 'ADMIN'
      },
      {
        email: 'luigi.bianchi@gmail.com',
        password: hashedPassword,
        fullName: 'Luigi Bianchi',
        firstName: 'Luigi',
        lastName: 'Bianchi',
        username: 'luigi.bianchi',
        role: 'CLIENT',
        phone: '3331234567',
        city: 'Napoli'
      },
      {
        email: 'maria.rossi@hotmail.it',
        password: hashedPassword,
        fullName: 'Maria Rossi',
        firstName: 'Maria',
        lastName: 'Rossi',
        username: 'maria.rossi',
        role: 'CLIENT',
        phone: '3332345678',
        city: 'Roma'
      },
      {
        email: 'giuseppe.verdi@libero.it',
        password: hashedPassword,
        fullName: 'Giuseppe Verdi',
        firstName: 'Giuseppe',
        lastName: 'Verdi',
        username: 'giuseppe.verdi',
        role: 'CLIENT',
        phone: '3333456789',
        city: 'Torino'
      },
      {
        email: 'anna.ferrari@outlook.it',
        password: hashedPassword,
        fullName: 'Anna Ferrari',
        firstName: 'Anna',
        lastName: 'Ferrari',
        username: 'anna.ferrari',
        role: 'CLIENT',
        phone: '3334567890',
        city: 'Bologna'
      },
      {
        email: 'mario.rossi@assistenza.it',
        password: hashedPassword,
        fullName: 'Mario Rossi',
        firstName: 'Mario',
        lastName: 'Rossi',
        username: 'mario.rossi',
        role: 'PROFESSIONAL',
        phone: '3351112223',
        profession: 'Idraulico',
        city: 'Roma'
      },
      {
        email: 'francesco.russo@assistenza.it',
        password: hashedPassword,
        fullName: 'Francesco Russo',
        firstName: 'Francesco',
        lastName: 'Russo',
        username: 'francesco.russo',
        role: 'PROFESSIONAL',
        phone: '3362223334',
        profession: 'Elettricista',
        city: 'Milano'
      },
      {
        email: 'paolo.costa@assistenza.it',
        password: hashedPassword,
        fullName: 'Paolo Costa',
        firstName: 'Paolo',
        lastName: 'Costa',
        username: 'paolo.costa',
        role: 'PROFESSIONAL',
        phone: '3377778888',
        profession: 'Climatizzazione',
        city: 'Napoli'
      },
      {
        email: 'luca.moretti@assistenza.it',
        password: hashedPassword,
        fullName: 'Luca Moretti',
        firstName: 'Luca',
        lastName: 'Moretti',
        username: 'luca.moretti',
        role: 'PROFESSIONAL',
        phone: '3388889999',
        profession: 'Pulizie',
        city: 'Torino'
      }
    ]
    
    console.log('📧 AGGIORNAMENTO UTENTI:\n')
    
    for (const user of utenti) {
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName
          },
          create: {
            id: uuidv4(),
            email: user.email,
            password: user.password,
            fullName: user.fullName,
            firstName: user.firstName,
            lastName: user.lastName || '',
            username: user.username,
            role: user.role as any,
            phone: user.phone,
            profession: user.profession,
            address: user.city ? `Via ${user.city} 1` : 'Via Roma 1',
            city: user.city || 'Roma',
            province: user.city === 'Milano' ? 'MI' : user.city === 'Napoli' ? 'NA' : user.city === 'Torino' ? 'TO' : user.city === 'Bologna' ? 'BO' : 'RM',
            postalCode: user.city === 'Milano' ? '20100' : user.city === 'Napoli' ? '80100' : user.city === 'Torino' ? '10100' : user.city === 'Bologna' ? '40100' : '00100',
            isActive: true,
            emailVerified: true
          }
        })
        console.log(`✅ ${user.role.padEnd(15)} - ${user.email}`)
      } catch (error: any) {
        console.log(`❌ Errore - ${user.email}: ${error.message.split('\n')[0]}`)
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ UTENTI AGGIORNATI CON SUCCESSO!')
    console.log('='.repeat(60))
    
    console.log(`
📧 CREDENZIALI PER LOGIN:
=====================================
ADMIN:
• admin@assistenza.it / password123
• staff@assistenza.it / password123

CLIENTI:
• luigi.bianchi@gmail.com / password123
• maria.rossi@hotmail.it / password123
• giuseppe.verdi@libero.it / password123
• anna.ferrari@outlook.it / password123

PROFESSIONISTI:
• mario.rossi@assistenza.it / password123
• francesco.russo@assistenza.it / password123
• paolo.costa@assistenza.it / password123
• luca.moretti@assistenza.it / password123
=====================================
`)
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui
fixUtentiConFirstName()
