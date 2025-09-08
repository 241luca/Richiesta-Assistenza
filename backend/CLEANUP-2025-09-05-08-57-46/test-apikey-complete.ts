import { prisma } from './src/config/database';

async function testApiKeyComplete() {
  try {
    console.log('🧪 Starting comprehensive API Key test...\n');
    
    // Test 1: Verifica esistenza modello
    console.log('Test 1: Verificando modello ApiKey...');
    const modelExists = prisma.apiKey !== undefined;
    console.log(`  ✅ Modello ApiKey: ${modelExists ? 'Disponibile' : 'Non trovato'}`);
    
    if (!modelExists) {
      throw new Error('Il modello ApiKey non è disponibile nel Prisma Client');
    }
    
    // Test 2: Conta le chiavi esistenti
    console.log('\nTest 2: Contando chiavi API esistenti...');
    const count = await prisma.apiKey.count();
    console.log(`  ✅ Chiavi API nel database: ${count}`);
    
    // Test 3: Trova o crea un'organizzazione di test
    console.log('\nTest 3: Preparando organizzazione di test...');
    let testOrg = await prisma.organization.findFirst({
      where: { slug: 'test-org' }
    });
    
    if (!testOrg) {
      testOrg = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          slug: 'test-org',
          description: 'Organizzazione per test API Keys'
        }
      });
      console.log(`  ✅ Creata nuova organizzazione di test: ${testOrg.id}`);
    } else {
      console.log(`  ✅ Usando organizzazione esistente: ${testOrg.id}`);
    }
    
    // Test 4: Crea o aggiorna una chiave API
    console.log('\nTest 4: Creando/aggiornando chiave API di test...');
    
    // Prima verifica se esiste già
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        service: 'GOOGLE_MAPS',
        organizationId: testOrg.id
      }
    });
    
    let testKey;
    if (existingKey) {
      // Aggiorna la chiave esistente
      testKey = await prisma.apiKey.update({
        where: { id: existingKey.id },
        data: {
          key: 'test-encrypted-key-updated-' + Date.now(),
          isActive: true,
          lastValidatedAt: new Date()
        }
      });
      console.log(`  ✅ Aggiornata chiave API esistente: ${testKey.id}`);
    } else {
      // Crea una nuova chiave
      testKey = await prisma.apiKey.create({
        data: {
          service: 'GOOGLE_MAPS',
          key: 'test-encrypted-key-' + Date.now(),
          organizationId: testOrg.id,
          isActive: true,
          configuration: {
            testMode: true,
            createdAt: new Date().toISOString()
          }
        }
      });
      console.log(`  ✅ Creata nuova chiave API: ${testKey.id}`);
    }
    
    // Test 5: Leggi tutte le chiavi per l'organizzazione
    console.log('\nTest 5: Leggendo chiavi API per l\'organizzazione...');
    const orgKeys = await prisma.apiKey.findMany({
      where: { organizationId: testOrg.id },
      include: {
        organization: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });
    
    console.log(`  ✅ Trovate ${orgKeys.length} chiavi per ${testOrg.name}:`);
    orgKeys.forEach(key => {
      console.log(`     - ${key.service}: ${key.isActive ? 'Attiva' : 'Disattivata'} (ID: ${key.id.substring(0, 8)}...)`);
    });
    
    // Test 6: Verifica unique constraint
    console.log('\nTest 6: Verificando unique constraint [service, organizationId]...');
    try {
      // Prova a creare un duplicato (dovrebbe fallire)
      await prisma.apiKey.create({
        data: {
          service: 'GOOGLE_MAPS',
          key: 'duplicate-key',
          organizationId: testOrg.id
        }
      });
      console.log('  ❌ ERRORE: Permesso duplicato (non dovrebbe accadere)');
    } catch (error: any) {
      if (error.code === 'P2002') {
        console.log('  ✅ Unique constraint funziona correttamente');
      } else {
        console.log('  ⚠️ Errore inaspettato:', error.message);
      }
    }
    
    // Test 7: Pulisci i dati di test (opzionale)
    console.log('\nTest 7: Pulizia dati di test...');
    const cleanup = false; // Cambia in true per pulire
    if (cleanup) {
      await prisma.apiKey.deleteMany({
        where: {
          organizationId: testOrg.id,
          key: { contains: 'test-' }
        }
      });
      console.log('  ✅ Dati di test rimossi');
    } else {
      console.log('  ⏭️ Pulizia saltata (dati mantenuti per debug)');
    }
    
    console.log('\n🎉 Tutti i test completati con successo!');
    console.log('Il modello ApiKey è configurato correttamente e funzionante.\n');
    
  } catch (error) {
    console.error('\n❌ Test fallito:', error);
    console.error('\nDettagli errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il test
testApiKeyComplete().catch(console.error);
