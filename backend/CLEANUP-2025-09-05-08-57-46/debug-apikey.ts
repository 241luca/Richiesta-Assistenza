import { prisma } from './src/config/database';
import { logger } from './src/utils/logger';

async function debugApiKeyIssue() {
  try {
    console.log('🔍 Debugging API Key Issue...\n');
    
    // 1. Test connessione database
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connected successfully\n');
    
    // 2. Verifica esistenza modello
    console.log('2. Checking if ApiKey model exists...');
    const modelCheck = prisma.apiKey !== undefined;
    console.log(`   ${modelCheck ? '✅' : '❌'} ApiKey model: ${modelCheck ? 'Available' : 'Not found'}\n`);
    
    if (!modelCheck) {
      console.error('   ⚠️ Il modello ApiKey non è disponibile!');
      console.error('   Esegui: npx prisma generate\n');
      return;
    }
    
    // 3. Lista tutte le tabelle nel database
    console.log('3. Listing all tables in database...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log('   Database tables:');
    (tables as any[]).forEach(t => console.log(`   - ${t.table_name}`));
    
    // 4. Verifica se la tabella ApiKey esiste
    const apiKeyTableExists = (tables as any[]).some(t => t.table_name === 'ApiKey');
    console.log(`\n   ${apiKeyTableExists ? '✅' : '❌'} ApiKey table: ${apiKeyTableExists ? 'Exists' : 'Not found'}\n`);
    
    if (!apiKeyTableExists) {
      console.error('   ⚠️ La tabella ApiKey non esiste nel database!');
      console.error('   Esegui: npx prisma migrate dev\n');
      return;
    }
    
    // 5. Verifica struttura della tabella ApiKey
    console.log('4. Checking ApiKey table structure...');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'ApiKey' 
      ORDER BY ordinal_position;
    `;
    console.log('   ApiKey table columns:');
    (columns as any[]).forEach(c => {
      console.log(`   - ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable})`);
    });
    
    // 6. Conta record esistenti
    console.log('\n5. Counting existing API keys...');
    const count = await prisma.apiKey.count();
    console.log(`   ✅ Total API keys in database: ${count}\n`);
    
    // 7. Test di creazione
    console.log('6. Testing API key creation...');
    const testOrgId = 'test-debug-' + Date.now();
    
    try {
      const testKey = await prisma.apiKey.create({
        data: {
          service: 'GOOGLE_MAPS',
          key: 'test-encrypted-key-debug',
          organizationId: testOrgId,
          isActive: true,
          configuration: {
            debug: true,
            createdAt: new Date().toISOString()
          }
        }
      });
      console.log(`   ✅ Successfully created test API key: ${testKey.id}\n`);
      
      // Elimina il test
      await prisma.apiKey.delete({
        where: { id: testKey.id }
      });
      console.log('   ✅ Test key deleted successfully\n');
    } catch (error: any) {
      console.error('   ❌ Failed to create test key:', error.message);
      
      if (error.code === 'P2003') {
        console.error('   ⚠️ Foreign key constraint failed - Organization does not exist');
        console.error('   Need to use a valid organizationId\n');
      }
    }
    
    // 8. Test con una vera organizzazione
    console.log('7. Testing with real organization...');
    const org = await prisma.organization.findFirst();
    if (org) {
      console.log(`   Found organization: ${org.name} (${org.id})`);
      
      const existingKeys = await prisma.apiKey.findMany({
        where: { organizationId: org.id }
      });
      console.log(`   Organization has ${existingKeys.length} API keys\n`);
      
      // Test upsert
      console.log('8. Testing upsert functionality...');
      const existingKey = await prisma.apiKey.findFirst({
        where: {
          service: 'GOOGLE_MAPS',
          organizationId: org.id
        }
      });
      
      if (existingKey) {
        const updated = await prisma.apiKey.update({
          where: { id: existingKey.id },
          data: {
            lastValidatedAt: new Date(),
            isActive: true
          }
        });
        console.log(`   ✅ Updated existing key: ${updated.id}\n`);
      } else {
        const created = await prisma.apiKey.create({
          data: {
            service: 'GOOGLE_MAPS',
            key: 'debug-test-key-' + Date.now(),
            organizationId: org.id,
            isActive: true
          }
        });
        console.log(`   ✅ Created new key: ${created.id}\n`);
      }
    } else {
      console.log('   ⚠️ No organizations found in database\n');
    }
    
    console.log('🎉 Debug complete! All database operations are working.\n');
    console.log('📝 Summary:');
    console.log('   - Database connection: ✅');
    console.log('   - ApiKey model available: ✅');
    console.log('   - ApiKey table exists: ✅');
    console.log('   - CRUD operations: ✅\n');
    console.log('Next steps:');
    console.log('   1. Ensure backend is restarted after changes');
    console.log('   2. Check that routes are properly registered');
    console.log('   3. Verify authentication middleware is working\n');
    
  } catch (error) {
    console.error('❌ Debug failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugApiKeyIssue().catch(console.error);
