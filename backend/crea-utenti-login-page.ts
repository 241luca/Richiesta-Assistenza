import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function creaUtentiLoginPage() {
  console.log('\n🚀 CREAZIONE UTENTI DALLA LOGIN PAGE\n')
  console.log('='.repeat(60))
  
  try {
    // Password uguale per tutti come nella login page
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // UTENTI ESATTI DALLA LOGIN PAGE
    const utenti = [
      // ADMIN
      {
        email: 'admin@assistenza.it',
        password: hashedPassword,
        fullName: 'Super Admin',
        username: 'admin',
        role: 'STAFF',
        isActive: true,
        emailVerified: true
      },
      {
        email: 'staff@assistenza.it',
        password: hashedPassword,
        fullName: 'Staff Assistenza',
        username: 'staff',
        role: 'STAFF',
        isActive: true,
        emailVerified: true
      },
      
      // CLIENTI
      {
        email: 'luigi.bianchi@gmail.com',
        password: hashedPassword,
        fullName: 'Luigi Bianchi',
        username: 'luigi.bianchi',
        role: 'CLIENT',
        phone: '3331234567',
        address: 'Via Napoli 15',
        city: 'Napoli',
        province: 'NA',
        postalCode: '80100',
        isActive: true,
        emailVerified: true
      },
      {
        email: 'maria.rossi@hotmail.it',
        password: hashedPassword,
        fullName: 'Maria Rossi',
        username: 'maria.rossi',
        role: 'CLIENT',
        phone: '3332345678',
        address: 'Via Roma 45',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        isActive: true,
        emailVerified: true
      },
      {
        email: 'giuseppe.verdi@libero.it',
        password: hashedPassword,
        fullName: 'Giuseppe Verdi',
        username: 'giuseppe.verdi',
        role: 'CLIENT',
        phone: '3333456789',
        address: 'Via Torino 78',
        city: 'Torino',
        province: 'TO',
        postalCode: '10100',
        isActive: true,
        emailVerified: true
      },
      {
        email: 'anna.ferrari@outlook.it',
        password: hashedPassword,
        fullName: 'Anna Ferrari',
        username: 'anna.ferrari',
        role: 'CLIENT',
        phone: '3334567890',
        address: 'Via Bologna 23',
        city: 'Bologna',
        province: 'BO',
        postalCode: '40100',
        isActive: true,
        emailVerified: true
      },
      
      // PROFESSIONISTI
      {
        email: 'mario.rossi@assistenza.it',
        password: hashedPassword,
        fullName: 'Mario Rossi',
        username: 'mario.rossi',
        role: 'PROFESSIONAL',
        phone: '3351112223',
        address: 'Via Milano 34',
        city: 'Roma',
        province: 'RM',
        postalCode: '00185',
        profession: 'Idraulico',
        professionalInfo: {
          specialization: 'Idraulico',
          yearsExperience: 10,
          hourlyRate: 40,
          serviceAreas: ['RM', 'LT'],
          rating: 4.5
        },
        isActive: true,
        emailVerified: true
      },
      {
        email: 'francesco.russo@assistenza.it',
        password: hashedPassword,
        fullName: 'Francesco Russo',
        username: 'francesco.russo',
        role: 'PROFESSIONAL',
        phone: '3362223334',
        address: 'Via Verdi 56',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        profession: 'Elettricista',
        professionalInfo: {
          specialization: 'Elettricista',
          yearsExperience: 8,
          hourlyRate: 45,
          serviceAreas: ['MI', 'MB', 'CO'],
          rating: 4.7
        },
        isActive: true,
        emailVerified: true
      }
    ]
    
    console.log('📧 CREAZIONE UTENTI:\n')
    
    for (const user of utenti) {
      try {
        await prisma.user.create({
          data: {
            id: uuidv4(),
            ...user
          }
        })
        console.log(`✅ ${user.role.padEnd(15)} - ${user.email}`)
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Già esistente    - ${user.email}`)
        } else {
          console.log(`❌ Errore          - ${user.email}`)
        }
      }
    }
    
    // VERIFICA FINALE
    console.log('\n' + '='.repeat(60))
    console.log('📊 VERIFICA UTENTI CREATI')
    console.log('='.repeat(60))
    
    const totali = await prisma.user.count()
    const staff = await prisma.user.count({ where: { role: 'STAFF' } })
    const clienti = await prisma.user.count({ where: { role: 'CLIENT' } })
    const professionisti = await prisma.user.count({ where: { role: 'PROFESSIONAL' } })
    
    console.log(`
✅ Totale utenti: ${totali}
   - Staff: ${staff}
   - Clienti: ${clienti}
   - Professionisti: ${professionisti}

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
=====================================

✅ USA QUESTE CREDENZIALI NELLA LOGIN PAGE!
`)
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui
creaUtentiLoginPage()
