// Test diretto di Prisma
const { PrismaClient } = require('@prisma/client');

console.log('=== TEST PRISMA DIRECT ===');

// Crea una nuova istanza
const prisma = new PrismaClient();

async function test() {
  try {
    // Connetti
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Lista tutti i modelli disponibili
    const models = Object.keys(prisma).filter(key => {
      return !key.startsWith('_') && 
             !key.startsWith('$') && 
             key !== 'constructor';
    });
    
    console.log('\n📋 Available models:', models.length);
    models.forEach(model => {
      console.log(`  - ${model}`);
    });
    
    // Verifica scriptConfiguration
    if (prisma.scriptConfiguration) {
      console.log('\n✅ scriptConfiguration model FOUND!');
      const count = await prisma.scriptConfiguration.count();
      console.log(`   Records in table: ${count}`);
    } else {
      console.log('\n❌ scriptConfiguration model NOT FOUND!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
