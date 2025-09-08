import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking database state...\n')
    
    // Controlla se ci sono notifiche
    const notificationCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Notification"
    `
    console.log(`📊 Total notifications in database: ${notificationCount[0].count}`)
    
    // Mostra la struttura attuale della tabella
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Notification'
      ORDER BY ordinal_position
    `
    
    console.log('\n📋 Current Notification table structure:')
    console.table(columns)
    
    // Mostra alcune notifiche di esempio
    const sampleNotifications = await prisma.$queryRaw`
      SELECT * FROM "Notification" LIMIT 3
    `
    
    if (sampleNotifications.length > 0) {
      console.log('\n📌 Sample notifications:')
      console.table(sampleNotifications)
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabaseState()
