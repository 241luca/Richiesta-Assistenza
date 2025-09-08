import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetLoginAttempts() {
  try {
    console.log('🔓 Resetting login attempts for all users...\n')
    
    // Reset tutti i tentativi di login e sblocca tutti gli account
    const result = await prisma.user.updateMany({
      data: {
        loginAttempts: 0,
        lockedUntil: null
      }
    })
    
    console.log(`✅ Reset ${result.count} users`)
    
    // Mostra lo stato degli utenti
    const users = await prisma.user.findMany({
      select: {
        email: true,
        loginAttempts: true,
        lockedUntil: true,
        role: true
      }
    })
    
    console.log('\n📊 User status:')
    console.table(users)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetLoginAttempts()
