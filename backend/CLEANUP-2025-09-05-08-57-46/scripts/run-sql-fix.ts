import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function runSQLFix() {
  try {
    console.log('🔧 Running SQL fix for notifications...\n')
    
    // Leggi il file SQL
    const sqlPath = path.join(__dirname, 'fix-notifications.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')
    
    // Dividi le query (alcune devono essere eseguite separatamente)
    const queries = [
      `ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "message" TEXT`,
      `UPDATE "Notification" SET "message" = COALESCE("content", "title", 'Notifica di sistema') WHERE "message" IS NULL`,
      `ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "userId" TEXT`
    ]
    
    // Esegui ogni query
    for (const query of queries) {
      try {
        console.log(`📝 Executing: ${query.substring(0, 50)}...`)
        await prisma.$executeRawUnsafe(query)
        console.log('✅ Success')
      } catch (error) {
        console.log(`⚠️ Query failed (may already exist): ${error.message}`)
      }
    }
    
    // Assegna userId di default
    console.log('\n🔍 Finding default user...')
    const defaultUser = await prisma.user.findFirst()
    
    if (defaultUser) {
      console.log(`✅ Found user: ${defaultUser.email}`)
      
      // Aggiorna le notifiche senza userId
      const updateResult = await prisma.$executeRaw`
        UPDATE "Notification" 
        SET "userId" = ${defaultUser.id}
        WHERE "userId" IS NULL
      `
      console.log(`📝 Updated ${updateResult} notifications with default userId`)
      
      // Rendi i campi obbligatori
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Notification" ALTER COLUMN "message" SET NOT NULL`)
        console.log('✅ Made message column required')
      } catch (e) {
        console.log('⚠️ message column may already be NOT NULL')
      }
      
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "Notification" ALTER COLUMN "userId" SET NOT NULL`)
        console.log('✅ Made userId column required')
      } catch (e) {
        console.log('⚠️ userId column may already be NOT NULL')
      }
    } else {
      console.log('⚠️ No users found in database. Creating a default user...')
      
      // Trova un'organizzazione o creane una
      let org = await prisma.organization.findFirst()
      
      if (!org) {
        console.log('📝 Creating default organization...')
        org = await prisma.organization.create({
          data: {
            name: 'Default Organization',
            slug: 'default-org'
          }
        })
      }
      
      // Crea un utente di default
      const defaultUser = await prisma.user.create({
        data: {
          email: 'system@assistenza.local',
          username: 'system',
          password: 'not-used', // Questo utente non farà login
          firstName: 'System',
          lastName: 'User',
          fullName: 'System User',
          role: 'ADMIN',
          organizationId: org.id
        }
      })
      
      console.log(`✅ Created system user: ${defaultUser.email}`)
      
      // Aggiorna le notifiche
      const updateResult = await prisma.$executeRaw`
        UPDATE "Notification" 
        SET "userId" = ${defaultUser.id}
        WHERE "userId" IS NULL
      `
      console.log(`📝 Updated ${updateResult} notifications with system userId`)
    }
    
    // Verifica finale
    console.log('\n🔍 Final verification...')
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Notification'
      ORDER BY ordinal_position
    `
    console.table(columns)
    
    console.log('\n✅ Database fix completed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

runSQLFix()
