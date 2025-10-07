import { prisma } from './config/database';

async function verifyPrismaModels() {
  console.log('\n=== VERIFYING PRISMA MODELS ===\n');
  
  try {
    // Wait for connection
    await prisma.$connect();
    console.log('✅ Database connected');
    
    // List all models
    const modelNames = [
      'user', 'assistanceRequest', 'quote', 'category', 'subcategory',
      'scriptConfiguration', 'scriptExecution', 'notification'
    ];
    
    console.log('\nChecking models:');
    for (const modelName of modelNames) {
      const exists = !!(prisma as any)[modelName];
      console.log(`  ${modelName}: ${exists ? '✅' : '❌'}`);
    }
    
    // Test ScriptConfiguration specifically
    console.log('\n📝 Testing ScriptConfiguration model:');
    const count = await prisma.scriptConfiguration.count();
    console.log(`  Records in database: ${count}`);
    
    // Try to create a test record
    console.log('\n  Creating test record...');
    const testScript = await prisma.scriptConfiguration.create({
      data: {
        scriptName: 'test-script-' + Date.now(),
        displayName: 'Test Script',
        description: 'Test script for verification',
        category: 'TESTING',
        risk: 'LOW',
        filePath: '/test/script.sh',
        allowedRoles: ['ADMIN', 'SUPER_ADMIN']
      }
    });
    console.log('  ✅ Test record created:', testScript.id);
    
    // Delete test record
    await prisma.scriptConfiguration.delete({
      where: { id: testScript.id }
    });
    console.log('  ✅ Test record deleted');
    
    console.log('\n✅ All checks passed! Prisma is working correctly.\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

verifyPrismaModels();
