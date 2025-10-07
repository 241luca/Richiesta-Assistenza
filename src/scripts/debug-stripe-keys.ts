import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugStripeKeys() {
  console.log('🔍 Debug Chiavi Stripe nel Database\n');
  console.log('=' .repeat(50));
  
  try {
    // Mostra TUTTE le chiavi relative a Stripe
    const allStripeKeys = await prisma.apiKey.findMany({
      where: {
        OR: [
          { service: { contains: 'stripe', mode: 'insensitive' } },
          { key: { contains: 'stripe', mode: 'insensitive' } },
          { key: { contains: 'STRIPE' } },
          { value: { startsWith: 'sk_' } },
          { value: { startsWith: 'pk_' } },
          { value: { startsWith: 'whsec_' } }
        ]
      }
    });
    
    console.log(`\n📊 Trovate ${allStripeKeys.length} chiavi relative a Stripe:\n`);
    
    allStripeKeys.forEach((apiKey, index) => {
      console.log(`${index + 1}. Chiave: "${apiKey.key}"`);
      console.log(`   Service: ${apiKey.service || 'N/A'}`);
      console.log(`   Name: ${apiKey.name || 'N/A'}`);
      console.log(`   Value: ${apiKey.value.substring(0, 30)}...`);
      console.log(`   Type: ${apiKey.value.startsWith('sk_') ? 'Secret Key' : 
                           apiKey.value.startsWith('pk_') ? 'Public Key' : 
                           apiKey.value.startsWith('whsec_') ? 'Webhook Secret' : 'Unknown'}`);
      console.log(`   Active: ${apiKey.isActive}`);
      console.log('   ---');
    });
    
    // Suggerimenti per fix
    console.log('\n💡 SUGGERIMENTI:\n');
    
    const hasSecretKey = allStripeKeys.some(k => k.value.startsWith('sk_'));
    const hasPublicKey = allStripeKeys.some(k => k.value.startsWith('pk_'));
    
    if (!hasSecretKey) {
      console.log('❌ Manca la Secret Key (dovrebbe iniziare con sk_)');
      console.log('   Vai su /admin/api-keys/stripe e inseriscila');
    }
    
    if (!hasPublicKey) {
      console.log('❌ Manca la Public Key (dovrebbe iniziare con pk_)');
      console.log('   Vai su /admin/api-keys/stripe e inseriscila');
    }
    
    // Controlla i nomi delle chiavi
    const secretKey = allStripeKeys.find(k => k.value.startsWith('sk_'));
    if (secretKey && secretKey.key !== 'STRIPE') {
      console.log(`\n⚠️  La Secret Key è salvata con key="${secretKey.key}" invece di "STRIPE"`);
      console.log('   Il sistema potrebbe cercarla con il nome sbagliato.');
      console.log('\n   Per risolvere, esegui questo comando SQL:');
      console.log(`   UPDATE "ApiKey" SET key = 'STRIPE' WHERE id = '${secretKey.id}';`);
    }
    
    const publicKey = allStripeKeys.find(k => k.value.startsWith('pk_'));
    if (publicKey && publicKey.key !== 'STRIPE_PUBLIC') {
      console.log(`\n⚠️  La Public Key è salvata con key="${publicKey.key}" invece di "STRIPE_PUBLIC"`);
      console.log('   Il sistema potrebbe cercarla con il nome sbagliato.');
      console.log('\n   Per risolvere, esegui questo comando SQL:');
      console.log(`   UPDATE "ApiKey" SET key = 'STRIPE_PUBLIC' WHERE id = '${publicKey.id}';`);
    }
    
  } catch (error: any) {
    console.error('❌ Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugStripeKeys()
  .then(() => {
    console.log('\n✅ Debug completato');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Debug fallito:', error);
    process.exit(1);
  });
