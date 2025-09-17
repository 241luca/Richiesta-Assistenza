const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testScriptConfiguration() {
  try {
    console.log('📋 Testing ScriptConfiguration model...');
    
    // Verifica che il modello esista
    const count = await prisma.scriptConfiguration.count();
    console.log(`✅ ScriptConfiguration model works! Records found: ${count}`);
    
    // Prova a leggere i record
    const scripts = await prisma.scriptConfiguration.findMany({
      where: { isEnabled: true }
    });
    
    console.log(`📜 Enabled scripts: ${scripts.length}`);
    
    if (scripts.length > 0) {
      console.log('First script:', scripts[0].displayName);
    }
    
    console.log('\n✅ TUTTO FUNZIONA CORRETTAMENTE!');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testScriptConfiguration();
