import { prisma } from './src/config/database';

async function testApiKeyModel() {
  try {
    console.log('Testing ApiKey model...');
    
    // Test 1: Verifica che il modello esista
    const count = await prisma.apiKey.count();
    console.log(`✅ ApiKey model exists. Current count: ${count}`);
    
    // Test 2: Lista tutte le chiavi API
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        service: true,
        organizationId: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log(`✅ Found ${apiKeys.length} API keys`);
    apiKeys.forEach(key => {
      console.log(`  - ${key.service} for org ${key.organizationId} (Active: ${key.isActive})`);
    });
    
    // Test 3: Verifica che possiamo creare una chiave di test
    const testOrgId = 'test-org-' + Date.now();
    const testKey = await prisma.apiKey.create({
      data: {
        service: 'GOOGLE_MAPS',
        key: 'test-encrypted-key',
        organizationId: testOrgId,
        isActive: true
      }
    });
    console.log(`✅ Successfully created test API key with ID: ${testKey.id}`);
    
    // Test 4: Elimina la chiave di test
    await prisma.apiKey.delete({
      where: { id: testKey.id }
    });
    console.log(`✅ Successfully deleted test API key`);
    
    console.log('\n🎉 All tests passed! ApiKey model is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il test
testApiKeyModel();
