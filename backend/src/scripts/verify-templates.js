// Script per verificare e caricare i template

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAndLoadTemplates() {
  console.log('\n🔍 VERIFICA TEMPLATE NEL DATABASE...\n');
  
  try {
    // 1. Verifica quanti template ci sono
    const count = await prisma.notificationTemplate.count();
    console.log(`📊 Template trovati: ${count}\n`);
    
    if (count === 0) {
      console.log('❌ Nessun template trovato!');
      console.log('🔧 Caricamento template in corso...\n');
      
      // Esegui lo script di seed
      const { exec } = require('child_process');
      exec('npx ts-node src/scripts/seed-all-notification-templates.ts', (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Errore: ${error}`);
          return;
        }
        console.log(stdout);
      });
    } else {
      // 2. Mostra i template esistenti
      const templates = await prisma.notificationTemplate.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          channels: true,
          isActive: true,
          category: true
        },
        take: 10
      });
      
      console.log('✅ Template esistenti (primi 10):');
      console.log('='.repeat(80));
      
      templates.forEach((t, index) => {
        console.log(`\n${index + 1}. ${t.name}`);
        console.log(`   ID: ${t.id}`);
        console.log(`   Code: ${t.code}`);
        console.log(`   Categoria: ${t.category}`);
        console.log(`   Canali: ${t.channels.join(', ')}`);
        console.log(`   Attivo: ${t.isActive ? '✅' : '❌'}`);
      });
      
      console.log('\n' + '='.repeat(80));
      console.log('\n📌 IMPORTANTE:');
      console.log('Se NON vedi le icone (matita, occhio, check, cestino) nel frontend:');
      console.log('1. Verifica che il backend risponda correttamente');
      console.log('2. Controlla la console del browser per errori');
      console.log('3. Prova a fare un hard refresh (Cmd+Shift+R)');
    }
    
  } catch (error) {
    console.error('❌ Errore durante la verifica:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAndLoadTemplates();
