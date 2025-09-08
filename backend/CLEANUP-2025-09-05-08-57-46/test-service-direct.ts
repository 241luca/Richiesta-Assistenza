import { apiKeyService } from './src/services/apiKey.service';
import { prisma } from './src/config/database';

async function testApiKeyService() {
  try {
    console.log('🧪 Testing API Key Service directly...\n');
    
    // 1. Trova un'organizzazione
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.error('❌ No organization found!');
      return;
    }
    
    console.log(`Using organization: ${org.name} (${org.id})\n`);
    
    // 2. Testa il metodo getAllApiKeys
    console.log('Testing getAllApiKeys...');
    try {
      const keys = await apiKeyService.getAllApiKeys(org.id);
      console.log(`✅ Success! Found ${keys.length} keys`);
      keys.forEach(key => {
        console.log(`  - ${key.service}: ${key.isActive ? 'Active' : 'Inactive'}`);
      });
    } catch (error: any) {
      console.error('❌ Error in getAllApiKeys:', error.message);
      console.error('Stack:', error.stack);
    }
    
    console.log('\n3. Checking if apiKey model exists in Prisma...');
    console.log(`apiKey model available: ${prisma.apiKey !== undefined}`);
    
    // 4. Test diretto con Prisma
    console.log('\n4. Testing direct Prisma query...');
    try {
      const directKeys = await prisma.apiKey.findMany({
        where: { organizationId: org.id }
      });
      console.log(`✅ Direct query success! Found ${directKeys.length} keys`);
    } catch (error: any) {
      console.error('❌ Direct query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiKeyService().catch(console.error);
