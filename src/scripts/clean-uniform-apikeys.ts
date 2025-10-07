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

async function cleanAndUniformApiKeys() {
  console.log('🧹 PULIZIA E UNIFORMAZIONE API KEYS v5.1\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Mostra cosa verrà fatto
    console.log('📋 PIANO DI PULIZIA:\n');
    console.log('❌ DA ELIMINARE:');
    console.log('   - brevo (xkeysib-INSERISCI...): chiave placeholder');
    console.log('   - google-maps (AIzaSyB7zix...): duplicato');
    console.log('   - openai (your_openai_api_key_here): placeholder');
    console.log('   - stripe (your_stripe_secret_key_here): placeholder');
    console.log('   - whatsapp (evolution_key...): da sostituire con WppConnect\n');
    
    console.log('✅ DA UNIFICARE (Stripe):');
    console.log('   - sk_live_51In0L2KigfK2PPGC... (Secret Key)');
    console.log('   - pk_live_51In0L2KigfK2PPGC... (Public Key)');
    console.log('   - http://localhost:3200/api/... (Webhook URL - non è il secret!)\n');
    
    console.log('✅ DA MANTENERE:');
    console.log('   - BREVO (ID: 6430ae23...)');
    console.log('   - GOOGLE_MAPS (ID: b1883200...)');
    console.log('   - OPENAI (ID: sk-6lTXYxn3p...)');
    console.log('   - TINYMCE (ID: ce4f6a8d4...)');
    console.log('   - google_calendar (OAuth credentials)\n');
    
    const confirm = await askQuestion('Procedere con la pulizia? (s/n): ');
    
    if (confirm.toLowerCase() !== 's') {
      console.log('Operazione annullata.');
      return;
    }
    
    // 2. Elimina le chiavi non valide
    console.log('\n🗑️ Eliminazione chiavi non valide...');
    
    const deleteResult = await prisma.$executeRaw`
      DELETE FROM "ApiKey" 
      WHERE "key" IN (
        'xkeysib-INSERISCI_LA_TUA_API_KEY_QUI',
        'AIzaSyB7zix_8OrL9ks3d6XcjHShHIQDDhI1lCI',
        'your_openai_api_key_here',
        'your_stripe_secret_key_here',
        'evolution_key_luca_2025_secure_21806'
      )
    `;
    
    console.log(`✅ Eliminate ${deleteResult} chiavi non valide`);
    
    // 3. Unifica le chiavi Stripe
    console.log('\n🔧 Unificazione chiavi Stripe...');
    
    // Recupera i valori corretti di Stripe
    const stripeKeys = await prisma.$queryRaw<any[]>`
      SELECT * FROM "ApiKey" 
      WHERE "key" IN (
        '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',
        'pk_live_51In0L2KigfK2PPGCwJPHeXrQDj9Qvz1avaUhRhzz2GiHp09KBQ239x28XRuAMpySmvwyY3QMWzaMR3F6iRun3jt000xcoXq1Cd',
        'http://localhost:3200/api/payments/stripe-webhook'
      )
    `;
    
    let secretKey = '';
    let publicKey = '';
    let webhookUrl = '';
    
    stripeKeys.forEach(key => {
      if (key.key.startsWith('sk_')) {
        secretKey = key.key;
      } else if (key.key.startsWith('pk_')) {
        publicKey = key.key;
      } else if (key.key.startsWith('http')) {
        webhookUrl = key.key; // Nota: questo è un URL, non il webhook secret!
      }
    });
    
    console.log('Trovate chiavi Stripe:');
    console.log(`  Secret: ${secretKey.substring(0, 20)}...`);
    console.log(`  Public: ${publicKey.substring(0, 20)}...`);
    console.log(`  Webhook URL: ${webhookUrl}`);
    
    // Chiedi il vero webhook secret
    console.log('\n⚠️ NOTA: Il webhook URL salvato non è il webhook secret!');
    const hasWebhookSecret = await askQuestion('Hai il webhook secret da Stripe (whsec_...)? (s/n): ');
    
    let webhookSecret = '';
    if (hasWebhookSecret.toLowerCase() === 's') {
      webhookSecret = await askQuestion('Inserisci il webhook secret: ');
    }
    
    // Elimina le vecchie chiavi Stripe separate
    await prisma.$executeRaw`
      DELETE FROM "ApiKey" 
      WHERE "key" IN (
        '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',
        'pk_live_51In0L2KigfK2PPGCwJPHeXrQDj9Qvz1avaUhRhzz2GiHp09KBQ239x28XRuAMpySmvwyY3QMWzaMR3F6iRun3jt000xcoXq1Cd',
        'http://localhost:3200/api/payments/stripe-webhook'
      )
    `;
    
    // Crea la nuova chiave Stripe unificata
    const isLive = secretKey.includes('_live_');
    
    await prisma.$executeRaw`
      INSERT INTO "ApiKey" (
        "id",
        "key",
        "name",
        "service",
        "userId",
        "permissions",
        "rateLimit",
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
          webhookUrl: webhookUrl,
          mode: isLive ? 'live' : 'test',
          capabilities: ['payments', 'invoices', 'customers', 'refunds', 'payouts'],
          configuredAt: new Date().toISOString()
        })}::jsonb,
        100,
        true,
        NOW(),
        NOW()
      )
    `;
    
    console.log('✅ Chiavi Stripe unificate');
    
    // 4. Configura WppConnect al posto di Evolution
    console.log('\n📱 Configurazione WppConnect...');
    
    const configureWpp = await askQuestion('Vuoi configurare WppConnect ora? (s/n): ');
    
    if (configureWpp.toLowerCase() === 's') {
      await prisma.$executeRaw`
        INSERT INTO "ApiKey" (
          "id",
          "key",
          "name",
          "service",
          "userId",
          "permissions",
          "rateLimit",
          "isActive",
          "createdAt",
          "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          'wppconnect_config',
          'WppConnect WhatsApp',
          'WHATSAPP',
          NULL,
          ${JSON.stringify({
            type: 'local',
            sessionName: 'richiesta-assistenza',
            autoStart: true,
            features: {
              sendMessages: true,
              receiveMessages: true,
              sendMedia: true,
              groups: true,
              contacts: true
            },
            configuredAt: new Date().toISOString()
          })}::jsonb,
          100,
          true,
          NOW(),
          NOW()
        )
      `;
      console.log('✅ WppConnect configurato');
    }
    
    // 5. Verifica finale
    console.log('\n📊 VERIFICA CONFIGURAZIONE FINALE:\n');
    
    const finalKeys = await prisma.$queryRaw<any[]>`
      SELECT "service", "key", "name" FROM "ApiKey" 
      ORDER BY "service", "key"
    `;
    
    console.log('Chiavi API configurate:');
    finalKeys.forEach(key => {
      console.log(`  ${key.service}: ${key.name} (${key.key})`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ PULIZIA E UNIFORMAZIONE COMPLETATA!\n');
    console.log('📋 Riepilogo:');
    console.log('  - Eliminate chiavi placeholder e duplicate');
    console.log('  - Stripe unificato in formato standard');
    console.log('  - WppConnect configurato (se scelto)');
    console.log('  - Sistema API Keys ora uniforme e pulito');
    
  } catch (error: any) {
    console.error('\n❌ ERRORE:', error.message);
    console.error('Dettagli:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
console.log('Sistema Richiesta Assistenza - Pulizia API Keys');
cleanAndUniformApiKeys()
  .then(() => {
    console.log('\n✅ Script completato');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script fallito:', error);
    process.exit(1);
  });
