import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixNotifications() {
  try {
    console.log('🔧 Fixing existing notifications...')
    
    // Conta le notifiche da sistemare
    const notificationsToFix = await prisma.notification.count({
      where: {
        OR: [
          { message: null },
          { userId: null }
        ]
      }
    })
    
    console.log(`📊 Found ${notificationsToFix} notifications to fix`)
    
    if (notificationsToFix > 0) {
      // Otteniamo il primo utente disponibile per assegnarlo come default
      const defaultUser = await prisma.user.findFirst()
      
      if (!defaultUser) {
        console.error('❌ No users found in database. Please create at least one user first.')
        return
      }
      
      // Aggiorniamo tutte le notifiche con valori mancanti
      const result = await prisma.notification.updateMany({
        where: {
          OR: [
            { message: null },
            { userId: null }
          ]
        },
        data: {
          message: 'Notifica sistema - Messaggio generato automaticamente',
          userId: defaultUser.id
        }
      })
      
      console.log(`✅ Fixed ${result.count} notifications`)
      
      // Verifichiamo che tutte le notifiche abbiano ora i campi necessari
      const stillBroken = await prisma.notification.count({
        where: {
          OR: [
            { message: null },
            { userId: null }
          ]
        }
      })
      
      if (stillBroken > 0) {
        console.warn(`⚠️ Still ${stillBroken} notifications need fixing`)
      } else {
        console.log('✅ All notifications have been fixed!')
      }
    } else {
      console.log('✅ No notifications need fixing')
    }
    
  } catch (error) {
    console.error('❌ Error fixing notifications:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui lo script
fixNotifications()
