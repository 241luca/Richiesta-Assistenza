import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function uniformApiKeys() {
  console.log('🔧 UNIFORMAZIONE SISTEMA API KEYS v5.1\n');
  console.log('=' .repeat(60));
  console.log('\nQuesto script uniformerà tutte le API Keys secondo lo standard.\n');
  
  try {
    // 1. Analizza situazione attuale
    console.log('📊 Analisi situazione attuale...\n');
    
    // Cerca tutte le chiavi Stripe esistenti
    const stripeKeys = await prisma.$queryRaw<any[]>`
      SELECT * FROM "ApiKey" 
      WHERE "service" IN ('STRIPE', 'stripe', 'STRIPE_PUBLIC')
      OR "key" IN ('STRIPE', 'STRIPE_PUBLIC', 'STRIPE_WEBHOOK')
      OR "key" LIKE '%stripe%'
    `;
    
    console.log(`Trovate ${stripeKeys.length} chiavi Stripe da uniformare:`);
    
    let secretKey = '';
    let publicKey = '';
    let webhookSecret = '';
    
    // Estrai le chiavi esistenti
    stripeKeys.forEach(key => {
      console.log(`  - ${key.key}: ${key.name || 'N/A'}`);
      
      // Determina quale chiave è quale basandosi sul valore
      const value = key.value || key.key || '';
      if (value.startsWith('sk_')) {
        secretKey = value;
      } else if (value.startsWith('pk_')) {
        publicKey = value;
      } else if (value.startsWith('whsec_')) {
        webhookSecret = value;
      }
    });
    
    // 2. Verifica cosa abbiamo trovato
    console.log('\n🔑 Chiavi identificate:');
    console.log(`  Secret Key: ${secretKey ? secretKey.substring(0, 20) + '...' : '❌ Non trovata'}`);
    console.log(`  Public Key: ${publicKey ? publicKey.substring(0, 20) + '...' : '❌ Non trovata'}`);
    console.log(`  Webhook Secret: ${webhookSecret ? 'Trovata' : '⚠️ Non configurata'}`);
    
    if (!secretKey || !publicKey) {
      console.log('\n❌ Mancano chiavi essenziali!');
      
      const insert = await askQuestion('\nVuoi inserirle manualmente ora? (s/n): ');
      if (insert.toLowerCase() === 's') {
        if (!secretKey) {
          secretKey = await askQuestion('Secret Key (sk_...): ');
        }
        if (!publicKey) {
          publicKey = await askQuestion('Public Key (pk_...): ');
        }
        if (!webhookSecret) {
          const hasWebhook = await askQuestion('Hai un Webhook Secret? (s/n): ');
          if (hasWebhook.toLowerCase() === 's') {
            webhookSecret = await askQuestion('Webhook Secret (whsec_...): ');
          }
        }
      } else {
        console.log('⚠️ Impossibile procedere senza le chiavi.');
        return;
      }
    }
    
    // 3. Chiedi conferma prima di procedere
    console.log('\n⚠️ ATTENZIONE: Questo script:');
    console.log('  1. Eliminerà le vecchie righe Stripe separate');
    console.log('  2. Creerà una nuova riga unificata con tutte le chiavi');
    console.log('  3. Aggiornerà il formato secondo lo standard\n');
    
    const confirm = await askQuestion('Vuoi procedere? (s/n): ');
    
    if (confirm.toLowerCase() !== 's') {
      console.log('Operazione annullata.');
      return;
    }
    
    // 4. Backup delle vecchie chiavi
    console.log('\n💾 Creazione backup...');
    const backup = {
      timestamp: new Date().toISOString(),
      keys: stripeKeys
    };
    console.log('Backup salvato:', JSON.stringify(backup, null, 2));
    
    // 5. Elimina le vecchie righe
    console.log('\n🗑️ Eliminazione vecchie righe...');
    
    await prisma.$executeRaw`
      DELETE FROM "ApiKey" 
      WHERE "service" IN ('STRIPE', 'stripe', 'STRIPE_PUBLIC')
      OR "key" IN ('STRIPE', 'STRIPE_PUBLIC', 'STRIPE_WEBHOOK')
      OR ("key" LIKE '%stripe%' AND "key" != 'stripe_keys')
    `;
    
    console.log('✅ Vecchie righe eliminate');
    
    // 6. Crea la nuova riga unificata
    console.log('\n✨ Creazione nuova configurazione unificata...');
    
    const isTestMode = secretKey.startsWith('sk_test');
    
    // Usa SQL diretto per evitare problemi con Prisma
    await prisma.$executeRaw`
      INSERT INTO "ApiKey" (
        "id",
        "key",
        "name",
        "service",
        "value",
        "permissions",
        "isActive",
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        'stripe_keys',
        'Stripe API Keys',
        'STRIPE',
        NULL,
        ${JSON.stringify({
          secretKey: secretKey,
          publicKey: publicKey,
          webhookSecret: webhookSecret || null,
          mode: isTestMode ? 'test' : 'live',
          capabilities: ['payments', 'invoices', 'customers', 'refunds'],
          configuredAt: new Date().toISOString()
        })}::jsonb,
        true,
        NOW(),
        NOW()
      )
    `;
    
    console.log('✅ Nuova configurazione creata');
    
    // 7. Verifica
    console.log('\n🔍 Verifica configurazione...');
    
    const newConfig = await prisma.$queryRaw<any[]>`
      SELECT * FROM "ApiKey" WHERE "key" = 'stripe_keys'
    `;
    
    if (newConfig.length > 0) {
      console.log('✅ Configurazione salvata correttamente:');
      console.log(`  - Key: ${newConfig[0].key}`);
      console.log(`  - Service: ${newConfig[0].service}`);
      console.log(`  - Mode: ${isTestMode ? '🧪 TEST' : '🔴 LIVE'}`);
      
      // 8. Crea anche le configurazioni per gli altri servizi se non esistono
      console.log('\n📝 Verifica altri servizi...');
      
      // Verifica Google Maps
      const googleMaps = await prisma.$queryRaw<any[]>`
        SELECT * FROM "ApiKey" WHERE "key" = 'google_maps_key'
      `;
      
      if (googleMaps.length === 0) {
        console.log('⚠️ Google Maps non configurato correttamente');
      } else {
        console.log('✅ Google Maps OK');
      }
      
      // Verifica Brevo
      const brevo = await prisma.$queryRaw<any[]>`
        SELECT * FROM "ApiKey" WHERE "key" = 'brevo_key'
      `;
      
      if (brevo.length === 0) {
        console.log('⚠️ Brevo non configurato correttamente');
      } else {
        console.log('✅ Brevo OK');
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ UNIFORMAZIONE COMPLETATA CON SUCCESSO!\n');
      console.log('📋 Prossimi passi:');
      console.log('1. Aggiorna payment.service.ts per usare il nuovo formato');
      console.log('2. Testa il sistema: npx ts-node src/scripts/test-stripe-uniform.ts');
      console.log('3. Verifica che i pagamenti funzionino');
      
    } else {
      console.error('❌ Errore: configurazione non salvata!');
    }
    
  } catch (error: any) {
    console.error('\n❌ ERRORE:', error.message);
    console.error('Dettagli:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
console.log('Sistema Richiesta Assistenza - Uniformazione API Keys');
uniformApiKeys()
  .then(() => {
    console.log('\n✅ Script completato');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script fallito:', error);
    process.exit(1);
  });
