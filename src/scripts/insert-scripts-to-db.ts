/**
 * Script per inserire i nuovi script nel database ScriptConfiguration
 */

import { PrismaClient } from '@prisma/client';
import { ScriptCategory, ScriptRisk, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function insertNewScriptsToDatabase() {
  try {
    console.log('🚀 Inserimento nuovi script nel database ScriptConfiguration...');

    // Script 1: TypeScript Errors Check
    const script1 = await prisma.scriptConfiguration.upsert({
      where: { scriptName: 'typescript-errors-check' },
      update: {
        displayName: 'TypeScript Errors Check',
        description: 'Controlla errori TypeScript in backend e frontend, ordinati per numero di errori',
        category: ScriptCategory.TESTING,
        risk: ScriptRisk.LOW,
        filePath: 'testing/typescript-errors-check',
        timeout: 120000,
        requiresConfirmation: false,
        allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN],
        icon: 'CommandLineIcon',
        color: 'orange',
        order: 150,
        purpose: 'Identifica e ordina tutti gli errori TypeScript nel progetto',
        whenToUse: 'Esegui regolarmente per mantenere il codice pulito e type-safe',
        whatItChecks: JSON.stringify([
          'Errori TypeScript nel backend (/backend)',
          'Errori TypeScript nel frontend (/src)',
          'Raggruppamento per file',
          'Ordinamento per numero di errori'
        ]),
        interpreteOutput: JSON.stringify({
          'File con molti errori': 'Priorità alta per la correzione',
          'Errori correlati': 'Spesso risolverne uno risolve altri',
          'Type errors': 'Indicano potenziali bug runtime'
        }),
        commonIssues: JSON.stringify({
          'Property does not exist': 'Tipo incompleto o errato',
          'Cannot find module': 'Import path sbagliato',
          'Type is not assignable': 'Incompatibilità di tipi'
        }),
        parameters: JSON.stringify([
          {
            name: 'area',
            type: 'select',
            options: ['all', 'backend', 'frontend'],
            default: 'all',
            description: 'Area da controllare'
          },
          {
            name: 'showDetails',
            type: 'boolean',
            default: true,
            description: 'Mostra dettagli degli errori'
          },
          {
            name: 'limit',
            type: 'number',
            default: 20,
            description: 'Numero massimo di file da mostrare'
          }
        ]),
        defaultParams: JSON.stringify({
          area: 'all',
          showDetails: true,
          limit: 20
        }),
        hasQuickMode: false,
        isComplexScript: false,
        isEnabled: true,
        isVisible: true,
        isDangerous: false
      },
      create: {
        scriptName: 'typescript-errors-check',
        displayName: 'TypeScript Errors Check',
        description: 'Controlla errori TypeScript in backend e frontend, ordinati per numero di errori',
        category: ScriptCategory.TESTING,
        risk: ScriptRisk.LOW,
        filePath: 'testing/typescript-errors-check',
        timeout: 120000,
        requiresConfirmation: false,
        allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN],
        icon: 'CommandLineIcon',
        color: 'orange',
        order: 150,
        purpose: 'Identifica e ordina tutti gli errori TypeScript nel progetto',
        whenToUse: 'Esegui regolarmente per mantenere il codice pulito e type-safe',
        whatItChecks: JSON.stringify([
          'Errori TypeScript nel backend (/backend)',
          'Errori TypeScript nel frontend (/src)',
          'Raggruppamento per file',
          'Ordinamento per numero di errori'
        ]),
        interpreteOutput: JSON.stringify({
          'File con molti errori': 'Priorità alta per la correzione',
          'Errori correlati': 'Spesso risolverne uno risolve altri',
          'Type errors': 'Indicano potenziali bug runtime'
        }),
        commonIssues: JSON.stringify({
          'Property does not exist': 'Tipo incompleto o errato',
          'Cannot find module': 'Import path sbagliato',
          'Type is not assignable': 'Incompatibilità di tipi'
        }),
        parameters: JSON.stringify([
          {
            name: 'area',
            type: 'select',
            options: ['all', 'backend', 'frontend'],
            default: 'all',
            description: 'Area da controllare'
          },
          {
            name: 'showDetails',
            type: 'boolean',
            default: true,
            description: 'Mostra dettagli degli errori'
          },
          {
            name: 'limit',
            type: 'number',
            default: 20,
            description: 'Numero massimo di file da mostrare'
          }
        ]),
        defaultParams: JSON.stringify({
          area: 'all',
          showDetails: true,
          limit: 20
        }),
        hasQuickMode: false,
        isComplexScript: false,
        isEnabled: true,
        isVisible: true,
        isDangerous: false
      }
    });

    console.log('✅ Script 1 inserito:', script1.displayName);

    // Script 2: Check ResponseFormatter Usage
    const script2 = await prisma.scriptConfiguration.upsert({
      where: { scriptName: 'check-response-formatter' },
      update: {
        displayName: 'Check ResponseFormatter Usage',
        description: 'Verifica che tutte le routes usino ResponseFormatter e che i services NON lo usino',
        category: ScriptCategory.TESTING,
        risk: ScriptRisk.LOW,
        filePath: 'testing/check-response-formatter',
        timeout: 60000,
        requiresConfirmation: false,
        allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN],
        icon: 'DocumentMagnifyingGlassIcon',
        color: 'blue',
        order: 160,
        purpose: 'Garantisce che il pattern ResponseFormatter sia usato correttamente',
        whenToUse: 'Prima di ogni commit o release per verificare consistenza del codice',
        whatItChecks: JSON.stringify([
          'Routes che NON usano ResponseFormatter',
          'Services che usano ResponseFormatter (errore)',
          'Pattern res.json() senza formatter',
          'Return diretti senza res.json'
        ]),
        interpreteOutput: JSON.stringify({
          'Routes senza ResponseFormatter': 'Da correggere per consistenza API',
          'Services con ResponseFormatter': 'Errore architetturale da correggere',
          'Violazioni trovate': 'Ogni violazione richiede correzione'
        }),
        commonIssues: JSON.stringify({
          'res.json({data})': 'Usare ResponseFormatter.success(data)',
          'Service con formatter': 'Service deve ritornare solo dati',
          'Pattern non standard': 'Seguire sempre il pattern definito'
        }),
        parameters: JSON.stringify([
          {
            name: 'showCode',
            type: 'boolean',
            default: true,
            description: 'Mostra il codice delle violazioni'
          },
          {
            name: 'checkServices',
            type: 'boolean',
            default: true,
            description: 'Controlla anche i services'
          }
        ]),
        defaultParams: JSON.stringify({
          showCode: true,
          checkServices: true
        }),
        hasQuickMode: false,
        isComplexScript: false,
        isEnabled: true,
        isVisible: true,
        isDangerous: false
      },
      create: {
        scriptName: 'check-response-formatter',
        displayName: 'Check ResponseFormatter Usage',
        description: 'Verifica che tutte le routes usino ResponseFormatter e che i services NON lo usino',
        category: ScriptCategory.TESTING,
        risk: ScriptRisk.LOW,
        filePath: 'testing/check-response-formatter',
        timeout: 60000,
        requiresConfirmation: false,
        allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN],
        icon: 'DocumentMagnifyingGlassIcon',
        color: 'blue',
        order: 160,
        purpose: 'Garantisce che il pattern ResponseFormatter sia usato correttamente',
        whenToUse: 'Prima di ogni commit o release per verificare consistenza del codice',
        whatItChecks: JSON.stringify([
          'Routes che NON usano ResponseFormatter',
          'Services che usano ResponseFormatter (errore)',
          'Pattern res.json() senza formatter',
          'Return diretti senza res.json'
        ]),
        interpreteOutput: JSON.stringify({
          'Routes senza ResponseFormatter': 'Da correggere per consistenza API',
          'Services con ResponseFormatter': 'Errore architetturale da correggere',
          'Violazioni trovate': 'Ogni violazione richiede correzione'
        }),
        commonIssues: JSON.stringify({
          'res.json({data})': 'Usare ResponseFormatter.success(data)',
          'Service con formatter': 'Service deve ritornare solo dati',
          'Pattern non standard': 'Seguire sempre il pattern definito'
        }),
        parameters: JSON.stringify([
          {
            name: 'showCode',
            type: 'boolean',
            default: true,
            description: 'Mostra il codice delle violazioni'
          },
          {
            name: 'checkServices',
            type: 'boolean',
            default: true,
            description: 'Controlla anche i services'
          }
        ]),
        defaultParams: JSON.stringify({
          showCode: true,
          checkServices: true
        }),
        hasQuickMode: false,
        isComplexScript: false,
        isEnabled: true,
        isVisible: true,
        isDangerous: false
      }
    });

    console.log('✅ Script 2 inserito:', script2.displayName);

    // Verifica che siano stati inseriti
    const totalScripts = await prisma.scriptConfiguration.count();
    console.log(`\n📊 Totale script configurati nel database: ${totalScripts}`);

    // Mostra gli script della categoria testing
    const testingScripts = await prisma.scriptConfiguration.findMany({
      where: { category: ScriptCategory.TESTING },
      select: { scriptName: true, displayName: true }
    });

    console.log('\n📋 Script nella categoria Testing:');
    testingScripts.forEach(s => {
      console.log(`  - ${s.scriptName}: ${s.displayName}`);
    });

    console.log('\n✅ Inserimento completato con successo!');
    console.log('🌐 Ora puoi vedere gli script su: http://localhost:5193/admin/scripts');
    console.log('\n💡 Nota: Potrebbe essere necessario ricaricare la pagina (F5) per vedere i nuovi script');

  } catch (error) {
    console.error('❌ Errore durante l\'inserimento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
insertNewScriptsToDatabase()
  .then(() => {
    console.log('\n✨ Script completato con successo!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script fallito:', error);
    process.exit(1);
  });