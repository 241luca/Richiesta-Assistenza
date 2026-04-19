/**
 * Script per inserire check-prisma-relations nel database ScriptConfiguration
 */

import { PrismaClient } from '@prisma/client';
import { ScriptCategory, ScriptRisk, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function insertPrismaRelationsScript() {
  try {
    console.log('🚀 Inserimento script check-prisma-relations nel database...');

    const script = await prisma.scriptConfiguration.upsert({
      where: { scriptName: 'check-prisma-relations' },
      update: {
        displayName: 'Check Prisma Relations',
        description: 'Analizza schema.prisma per trovare relazioni con e senza @relation',
        category: ScriptCategory.DATABASE,
        risk: ScriptRisk.LOW,
        filePath: 'check-prisma-relations',
        timeout: 30000,
        requiresConfirmation: false,
        allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN],
        icon: 'CircleStackIcon',
        color: 'purple',
        order: 170,
        purpose: 'Verifica che tutte le relazioni Prisma abbiano @relation per stabilità',
        whenToUse: 'Dopo modifiche allo schema o per verifiche periodiche di qualità',
        whatItChecks: JSON.stringify([
          'Relazioni con @relation (corrette)',
          'Relazioni senza @relation (da correggere)',
          'Conteggio per ogni modello',
          'Percentuale di conformità'
        ]),
        interpreteOutput: JSON.stringify({
          '✅ Con @relation': 'Relazione configurata correttamente',
          '❌ Senza @relation': 'Relazione da correggere per evitare problemi',
          'Percentuale corrette': 'Indicatore di qualità dello schema'
        }),
        commonIssues: JSON.stringify({
          'Relazione senza @relation': 'Aggiungere @relation con nome esplicito',
          'Nomi auto-generati': 'Usare nomi espliciti per maggiore controllo',
          'Relazioni ambigue': 'Specificare fields e references'
        }),
        parameters: JSON.stringify([
          {
            name: 'saveReport',
            type: 'boolean',
            default: false,
            description: 'Salva un report dettagliato su file'
          }
        ]),
        defaultParams: JSON.stringify({
          saveReport: false
        }),
        hasQuickMode: false,
        isComplexScript: false,
        isEnabled: true,
        isVisible: true,
        isDangerous: false
      },
      create: {
        scriptName: 'check-prisma-relations',
        displayName: 'Check Prisma Relations',
        description: 'Analizza schema.prisma per trovare relazioni con e senza @relation',
        category: ScriptCategory.DATABASE,
        risk: ScriptRisk.LOW,
        filePath: 'check-prisma-relations',
        timeout: 30000,
        requiresConfirmation: false,
        allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN],
        icon: 'CircleStackIcon',
        color: 'purple',
        order: 170,
        purpose: 'Verifica che tutte le relazioni Prisma abbiano @relation per stabilità',
        whenToUse: 'Dopo modifiche allo schema o per verifiche periodiche di qualità',
        whatItChecks: JSON.stringify([
          'Relazioni con @relation (corrette)',
          'Relazioni senza @relation (da correggere)',
          'Conteggio per ogni modello',
          'Percentuale di conformità'
        ]),
        interpreteOutput: JSON.stringify({
          '✅ Con @relation': 'Relazione configurata correttamente',
          '❌ Senza @relation': 'Relazione da correggere per evitare problemi',
          'Percentuale corrette': 'Indicatore di qualità dello schema'
        }),
        commonIssues: JSON.stringify({
          'Relazione senza @relation': 'Aggiungere @relation con nome esplicito',
          'Nomi auto-generati': 'Usare nomi espliciti per maggiore controllo',
          'Relazioni ambigue': 'Specificare fields e references'
        }),
        parameters: JSON.stringify([
          {
            name: 'saveReport',
            type: 'boolean',
            default: false,
            description: 'Salva un report dettagliato su file'
          }
        ]),
        defaultParams: JSON.stringify({
          saveReport: false
        }),
        hasQuickMode: false,
        isComplexScript: false,
        isEnabled: true,
        isVisible: true,
        isDangerous: false
      }
    });

    console.log('✅ Script inserito:', script.displayName);

    // Aggiungi anche al ShellScriptsService
    console.log('\n📝 Ricorda di aggiungere anche al ShellScriptsService:');
    console.log(`
      {
        name: 'check-prisma-relations',
        displayName: 'Check Prisma Relations',
        description: 'Analizza schema.prisma per trovare relazioni con e senza @relation',
        available: true
      }
    `);

    console.log('\n✅ Inserimento completato!');
    console.log('🌐 Ora puoi vedere lo script su: http://localhost:5193/admin/scripts');

  } catch (error: unknown) {
    console.error('❌ Errore durante l\'inserimento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
insertPrismaRelationsScript()
  .then(() => {
    console.log('\n✨ Script completato con successo!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script fallito:', error);
    process.exit(1);
  });