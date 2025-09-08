import { prisma } from './src/config/database';
import { apiKeyService } from './src/services/apiKey.service';

async function checkApiKeys() {
  try {
    console.log('🔍 Checking API Keys in database...\n');
    
    // 1. Get organization
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.error('No organization found');
      return;
    }
    
    console.log(`Organization: ${org.name} (${org.id})\n`);
    
    // 2. Get all API keys directly from database
    console.log('Direct database query:');
    const directKeys = await prisma.apiKey.findMany({
      where: { organizationId: org.id }
    });
    
    directKeys.forEach(key => {
      console.log(`\n📌 ${key.service}:`);
      console.log(`   ID: ${key.id}`);
      console.log(`   Key (encrypted): ${key.key.substring(0, 20)}...`);
      console.log(`   Active: ${key.isActive}`);
      console.log(`   Created: ${key.createdAt}`);
      console.log(`   Updated: ${key.updatedAt}`);
    });
    
    // 3. Get through service (with decryption)
    console.log('\n\nThrough API Service (decrypted):');
    for (const service of ['GOOGLE_MAPS', 'BREVO', 'OPENAI'] as const) {
      const key = await apiKeyService.getApiKey(service, org.id);
      if (key) {
        // Decrypt the key
        const decrypted = apiKeyService.decryptKey(key.key);
        console.log(`\n📌 ${service}:`);
        console.log(`   Decrypted: ${decrypted.substring(0, 10)}...${decrypted.slice(-4)}`);
        console.log(`   Full length: ${decrypted.length} characters`);
      } else {
        console.log(`\n❌ ${service}: Not found`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeys().catch(console.error);
