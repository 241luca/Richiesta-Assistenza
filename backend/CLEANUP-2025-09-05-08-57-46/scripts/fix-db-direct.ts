import { Pool } from 'pg'

// Connessione diretta al database senza Prisma
const pool = new Pool({
  connectionString: 'postgresql://lucamambelli@localhost:5432/assistenza_db'
})

async function fixDatabaseDirectly() {
  const client = await pool.connect()
  
  try {
    console.log('🔧 Fixing database directly with SQL...\n')
    
    // 1. Fix Notification table
    console.log('📝 Fixing Notification table...')
    
    // Aggiungi colonne mancanti
    await client.query(`ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "message" TEXT`)
    await client.query(`ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "userId" TEXT`)
    
    // Aggiorna valori NULL in message
    await client.query(`
      UPDATE "Notification" 
      SET "message" = COALESCE("content", "title", 'Notifica di sistema')
      WHERE "message" IS NULL
    `)
    
    // 2. Fix User table - aggiungi colonne mancanti
    console.log('📝 Fixing User table...')
    
    const userColumns = [
      { name: 'status', type: 'TEXT', default: "'offline'" },
      { name: 'lastSeenAt', type: 'TIMESTAMP', default: 'NULL' },
      { name: 'avatar', type: 'TEXT', default: 'NULL' },
      { name: 'bio', type: 'TEXT', default: 'NULL' },
      { name: 'emailVerified', type: 'BOOLEAN', default: 'false' },
      { name: 'emailVerifiedAt', type: 'TIMESTAMP', default: 'NULL' },
      { name: 'lastLoginAt', type: 'TIMESTAMP', default: 'NULL' },
      { name: 'loginAttempts', type: 'INTEGER', default: '0' },
      { name: 'lockedUntil', type: 'TIMESTAMP', default: 'NULL' }
    ]
    
    for (const col of userColumns) {
      try {
        await client.query(`
          ALTER TABLE "User" 
          ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type} DEFAULT ${col.default}
        `)
        console.log(`  ✅ Added column ${col.name}`)
      } catch (e) {
        console.log(`  ⚠️ Column ${col.name} might already exist`)
      }
    }
    
    // 3. Trova o crea un utente di default
    console.log('\n📝 Finding or creating default user...')
    
    const userResult = await client.query(`SELECT id FROM "User" LIMIT 1`)
    
    let userId
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id
      console.log(`  ✅ Found existing user: ${userId}`)
    } else {
      // Crea organizzazione se non esiste
      const orgResult = await client.query(`SELECT id FROM "Organization" LIMIT 1`)
      
      let orgId
      if (orgResult.rows.length > 0) {
        orgId = orgResult.rows[0].id
      } else {
        const newOrg = await client.query(`
          INSERT INTO "Organization" (id, name, slug, "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), 'Default Organization', 'default-org', true, NOW(), NOW())
          RETURNING id
        `)
        orgId = newOrg.rows[0].id
        console.log(`  ✅ Created organization: ${orgId}`)
      }
      
      // Crea utente di sistema
      const newUser = await client.query(`
        INSERT INTO "User" (
          id, email, username, password, "firstName", "lastName", "fullName",
          role, "organizationId", "createdAt", "updatedAt", status, "emailVerified"
        )
        VALUES (
          gen_random_uuid(), 
          'system@assistenza.local', 
          'system',
          'not-used',
          'System',
          'User',
          'System User',
          'ADMIN',
          $1,
          NOW(),
          NOW(),
          'offline',
          true
        )
        RETURNING id
      `, [orgId])
      
      userId = newUser.rows[0].id
      console.log(`  ✅ Created system user: ${userId}`)
    }
    
    // 4. Aggiorna notifiche con userId
    console.log('\n📝 Updating notifications with userId...')
    const updateResult = await client.query(`
      UPDATE "Notification" 
      SET "userId" = $1
      WHERE "userId" IS NULL
    `, [userId])
    
    console.log(`  ✅ Updated ${updateResult.rowCount} notifications`)
    
    // 5. Rendi i campi obbligatori
    console.log('\n📝 Making fields required...')
    
    try {
      await client.query(`ALTER TABLE "Notification" ALTER COLUMN "message" SET NOT NULL`)
      console.log('  ✅ Made message NOT NULL')
    } catch (e) {
      console.log('  ⚠️ message might already be NOT NULL')
    }
    
    try {
      await client.query(`ALTER TABLE "Notification" ALTER COLUMN "userId" SET NOT NULL`)
      console.log('  ✅ Made userId NOT NULL')
    } catch (e) {
      console.log('  ⚠️ userId might already be NOT NULL')
    }
    
    // 6. Verifica finale
    console.log('\n🔍 Final verification...')
    
    const notifCount = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT("message") as with_message,
        COUNT("userId") as with_user
      FROM "Notification"
    `)
    
    console.table(notifCount.rows[0])
    
    console.log('\n✅ Database fix completed successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

fixDatabaseDirectly()
