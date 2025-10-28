import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function toggleImageModule() {
  try {
    const action = process.argv[2]; // 'enable' o 'disable'
    
    if (!action || !['enable', 'disable'].includes(action)) {
      console.log('❌ Uso: npm run tsx scripts/toggle-image-module.ts [enable|disable]');
      return;
    }

    const isEnabled = action === 'enable';
    
    console.log(`🔄 ${isEnabled ? 'Abilitando' : 'Disabilitando'} il modulo image-management...`);

    // Aggiorna lo stato del modulo
    const updatedModule = await prisma.systemModule.update({
      where: { code: 'image-management' },
      data: { isEnabled }
    });

    console.log(`✅ Modulo ${isEnabled ? 'abilitato' : 'disabilitato'} con successo!`);
    console.log(`   - Nome: ${updatedModule.name}`);
    console.log(`   - Stato: ${updatedModule.isEnabled ? 'ABILITATO' : 'DISABILITATO'}`);
    
    console.log('\n📝 Ora puoi testare:');
    console.log('1. Vai su http://localhost:5193/dashboard');
    console.log('2. Verifica che ImageReminders sia visibile/nascosto');
    console.log('3. Vai su una pagina con ProfileImageUpload');
    console.log('4. Verifica che il caricamento sia abilitato/disabilitato');
    console.log('5. Controlla i messaggi di errore appropriati');
    
    if (!isEnabled) {
      console.log('\n⚠️ IMPORTANTE: Ricordati di riabilitare il modulo con:');
      console.log('   npx tsx scripts/toggle-image-module.ts enable');
    }

  } catch (error) {
    console.error('❌ Errore durante il toggle del modulo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

toggleImageModule();