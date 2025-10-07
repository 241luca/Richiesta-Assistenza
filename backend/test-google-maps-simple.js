const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('\n🔍 TEST GOOGLE MAPS API KEY\n');
  
  try {
    // Test 1: Cerca con findUnique (come fa il codice)
    console.log('1️⃣ Test findUnique con service="GOOGLE_MAPS":');
    const uniqueResult = await prisma.apiKey.findUnique({
      where: { service: 'GOOGLE_MAPS' }
    });
    console.log('   Risultato:', uniqueResult ? '✅ TROVATA' : '❌ NON TROVATA');
    if (uniqueResult) {
      console.log('   ID:', uniqueResult.id);
      console.log('   Name:', uniqueResult.name);
      console.log('   isActive:', uniqueResult.isActive);
      console.log('   key (primi 20):', uniqueResult.key?.substring(0, 20));
    }
    
    console.log('\n2️⃣ Test findMany per vedere TUTTE le chiavi GOOGLE_MAPS:');
    const allResults = await prisma.apiKey.findMany({
      where: { service: 'GOOGLE_MAPS' }
    });
    console.log('   Trovate:', allResults.length, 'chiavi');
    
    if (allResults.length > 1) {
      console.log('\n⚠️  PROBLEMA: Ci sono', allResults.length, 'chiavi con service="GOOGLE_MAPS"!');
      console.log('   Ma service dovrebbe essere UNIQUE!\n');
      allResults.forEach((k, i) => {
        console.log(`   Chiave ${i + 1}:`);
        console.log('     ID:', k.id);
        console.log('     Name:', k.name);
        console.log('     isActive:', k.isActive);
      });
    }
    
    console.log('\n3️⃣ Test findMany per vedere chiavi simili:');
    const similarResults = await prisma.apiKey.findMany({
      where: {
        OR: [
          { service: { contains: 'GOOGLE', mode: 'insensitive' } },
          { service: { contains: 'MAPS', mode: 'insensitive' } },
          { name: { contains: 'Google Maps', mode: 'insensitive' } }
        ]
      }
    });
    console.log('   Trovate:', similarResults.length, 'chiavi simili');
    similarResults.forEach((k, i) => {
      console.log(`   ${i + 1}. service="${k.service}" name="${k.name}" active=${k.isActive}`);
    });
    
  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

test();
