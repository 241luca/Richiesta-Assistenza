import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeApiKeysStructure() {
  console.log('📊 ANALISI STRUTTURA API KEYS\n');
  console.log('=' .repeat(60));
  
  try {
    // Query diretta per vedere la struttura della tabella
    const tableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ApiKey'
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Struttura tabella ApiKey:');
    console.log(tableStructure);
    
    // Recupera tutte le API keys per capire come sono salvate
    const allKeys = await prisma.$queryRaw`
      SELECT * FROM "ApiKey" 
      ORDER BY "service", "key"
    `;
    
    console.log('\n🔑 Tutte le API Keys nel database:');
    console.log('-'.repeat(60));
    
    // @ts-ignore
    allKeys.forEach((key: any, index: number) => {
      console.log(`\n${index + 1}. Service: ${key.service || 'N/A'}`);
      console.log(`   Key ID: ${key.key}`);
      console.log(`   Name: ${key.name || 'N/A'}`);
      
      // Mostra solo i primi caratteri dei valori sensibili
      if (key.value) {
        console.log(`   Value: ${key.value.substring(0, 30)}...`);
      }
      if (key.permissions) {
        console.log(`   Permissions: ${JSON.stringify(key.permissions).substring(0, 100)}...`);
      }
    });
    
  } catch (error: any) {
    console.error('❌ Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeApiKeysStructure()
  .then(() => {
    console.log('\n✅ Analisi completata');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analisi fallita:', error);
    process.exit(1);
  });
