/**
 * Script per inserire i nuovi script nella tabella ScriptRegistry del database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function insertNewScripts() {
  try {
    console.log('🚀 Inserimento nuovi script nel database...');

    // Script 1: TypeScript Errors Check
    const script1 = await prisma.scriptRegistry.upsert({
      where: { scriptId: 'typescript-errors-check' },
      update: {
        name: 'TypeScript Errors Check',
        description: 'Controlla errori TypeScript in backend e frontend, ordinati per numero di errori',
        category: 'testing',
        path: 'testing/typescript-errors-check.ts',
        risk: 'low',
        requireConfirmation: false,
        minRole: 'ADMIN',
        timeout: 120000,
        enabled: true,
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
            description: 'Numero massimo di file da mostrare per area'
          }
        ])
      },
      create: {
        scriptId: 'typescript-errors-check',
        name: 'TypeScript Errors Check',
        description: 'Controlla errori TypeScript in backend e frontend, ordinati per numero di errori',
        category: 'testing',
        path: 'testing/typescript-errors-check.ts',
        risk: 'low',
        requireConfirmation: false,
        minRole: 'ADMIN',
        timeout: 120000,
        enabled: true,
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
            description: 'Numero massimo di file da mostrare per area'
          }
        ])
      }
    });

    console.log('✅ Script 1 inserito:', script1.name);

    // Script 2: Check ResponseFormatter Usage
    const script2 = await prisma.scriptRegistry.upsert({
      where: { scriptId: 'check-response-formatter' },
      update: {
        name: 'Check ResponseFormatter Usage',
        description: 'Verifica che tutte le routes usino ResponseFormatter e che i services NON lo usino',
        category: 'testing',
        path: 'testing/check-response-formatter.ts',
        risk: 'low',
        requireConfirmation: false,
        minRole: 'ADMIN',
        timeout: 60000,
        enabled: true,
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
            description: 'Controlla anche che i services NON usino ResponseFormatter'
          }
        ])
      },
      create: {
        scriptId: 'check-response-formatter',
        name: 'Check ResponseFormatter Usage',
        description: 'Verifica che tutte le routes usino ResponseFormatter e che i services NON lo usino',
        category: 'testing',
        path: 'testing/check-response-formatter.ts',
        risk: 'low',
        requireConfirmation: false,
        minRole: 'ADMIN',
        timeout: 60000,
        enabled: true,
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
            description: 'Controlla anche che i services NON usino ResponseFormatter'
          }
        ])
      }
    });

    console.log('✅ Script 2 inserito:', script2.name);

    // Verifica che siano stati inseriti
    const totalScripts = await prisma.scriptRegistry.count();
    console.log(`\n📊 Totale script nel database: ${totalScripts}`);

    // Mostra gli script della categoria testing
    const testingScripts = await prisma.scriptRegistry.findMany({
      where: { category: 'testing' },
      select: { scriptId: true, name: true }
    });

    console.log('\n📋 Script nella categoria Testing:');
    testingScripts.forEach(s => {
      console.log(`  - ${s.scriptId}: ${s.name}`);
    });

    console.log('\n✅ Inserimento completato con successo!');
    console.log('🌐 Ora puoi vedere gli script su: http://localhost:5193/admin/scripts');

  } catch (error) {
    console.error('❌ Errore durante l\'inserimento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
insertNewScripts()
  .then(() => {
    console.log('\n✨ Script completato!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script fallito:', error);
    process.exit(1);
  });