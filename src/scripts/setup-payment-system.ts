import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Funzione per leggere input dall'utente
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

async function setupPaymentSystem() {
  console.log('🚀 SETUP SISTEMA PAGAMENTI STRIPE v5.1\n');
  console.log('=' .repeat(50));
  
  try {
    console.log('\n📝 Configurazione chiavi Stripe\n');
    console.log('Puoi trovare le tue chiavi su: https://dashboard.stripe.com/apikeys\n');
    
    // Chiedi le chiavi o usa quelle di test
    const useTestKeys = await askQuestion('Vuoi usare chiavi di TEST predefinite? (s/n): ');
    
    let secretKey: string;
    let publicKey: string;
    let webhookSecret: string = '';
    
    if (useTestKeys.toLowerCase() === 's' || useTestKeys.toLowerCase() === 'y') {
      // Usa chiavi di test di esempio (non funzionanti, solo per demo)
      secretKey = 'sk_test_51234567890abcdefghijklmnopqrstuvwxyz';
      publicKey = 'pk_test_51234567890abcdefghijklmnopqrstuvwxyz';
      console.log('\n⚠️  Usando chiavi di TEST di esempio (sostituisci con le tue reali)');
    } else {
      // Chiedi le chiavi reali
      console.log('\nInserisci le tue chiavi Stripe:');
      secretKey = await askQuestion('Secret Key (sk_test_... o sk_live_...): ');
      publicKey = await askQuestion('Public Key (pk_test_... o pk_live_...): ');
      
      const hasWebhook = await askQuestion('Hai configurato un webhook? (s/n): ');
      if (hasWebhook.toLowerCase() === 's' || hasWebhook.toLowerCase() === 'y') {
        webhookSecret = await askQuestion('Webhook Secret (whsec_...): ');
      }
    }
    
    // Validazione base delle chiavi
    if (!secretKey.startsWith('sk_')) {
      console.error('❌ La Secret Key deve iniziare con sk_test_ o sk_live_');
      return;
    }
    
    if (!publicKey.startsWith('pk_')) {
      console.error('❌ La Public Key deve iniziare con pk_test_ o pk_live_');
      return;
    }
    
    const isTestMode = secretKey.startsWith('sk_test_');
    console.log(`\n🔑 Modalità: ${isTestMode ? 'TEST' : 'LIVE'}`);
    
    // 1. Salva le chiavi API nel database
    console.log('\n1️⃣ Salvataggio chiavi API nel database...');
    
    // Secret Key
    await prisma.apiKey.upsert({
      where: { key: 'STRIPE' },
      update: { 
        value: secretKey,
        description: `Stripe Secret Key (${isTestMode ? 'TEST' : 'LIVE'})`,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        key: 'STRIPE',
        value: secretKey,
        service: 'STRIPE',
        description: `Stripe Secret Key (${isTestMode ? 'TEST' : 'LIVE'})`,
        isActive: true
      }
    });
    console.log('✅ Secret Key salvata');
    
    // Public Key
    await prisma.apiKey.upsert({
      where: { key: 'STRIPE_PUBLIC' },
      update: { 
        value: publicKey,
        description: `Stripe Public Key (${isTestMode ? 'TEST' : 'LIVE'})`,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        key: 'STRIPE_PUBLIC',
        value: publicKey,
        service: 'STRIPE',
        description: `Stripe Public Key (${isTestMode ? 'TEST' : 'LIVE'})`,
        isActive: true
      }
    });
    console.log('✅ Public Key salvata');
    
    // Webhook Secret (se fornito)
    if (webhookSecret) {
      await prisma.apiKey.upsert({
        where: { key: 'STRIPE_WEBHOOK' },
        update: { 
          value: webhookSecret,
          description: 'Stripe Webhook Secret',
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          key: 'STRIPE_WEBHOOK',
          value: webhookSecret,
          service: 'STRIPE',
          description: 'Stripe Webhook Secret',
          isActive: true
        }
      });
      console.log('✅ Webhook Secret salvato');
    }
    
    // 2. Configura impostazioni di pagamento per i professionisti esistenti
    console.log('\n2️⃣ Configurazione impostazioni professionisti...');
    
    const professionals = await prisma.user.findMany({
      where: { role: 'PROFESSIONAL' },
      take: 3
    });
    
    for (const professional of professionals) {
      await prisma.professionalPaymentSettings.upsert({
        where: { professionalId: professional.id },
        update: {
          paymentMethods: ['CARD', 'BANK_TRANSFER'],
          payoutFrequency: 'WEEKLY',
          minimumPayoutAmount: 50,
          taxRate: 22,
          updatedAt: new Date()
        },
        create: {
          professionalId: professional.id,
          paymentMethods: ['CARD', 'BANK_TRANSFER'],
          payoutFrequency: 'WEEKLY',
          minimumPayoutAmount: 50,
          taxRate: 22,
          invoicePrefix: 'INV'
        }
      });
    }
    console.log(`✅ Configurate impostazioni per ${professionals.length} professionisti`);
    
    // 3. Crea dati di esempio (solo in modalità TEST)
    if (isTestMode) {
      const createExampleData = await askQuestion('\nVuoi creare dati di esempio? (s/n): ');
      
      if (createExampleData.toLowerCase() === 's' || createExampleData.toLowerCase() === 'y') {
        console.log('\n3️⃣ Creazione dati di esempio...');
        
        // Trova un cliente e un professionista
        const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
        const professional = await prisma.user.findFirst({ where: { role: 'PROFESSIONAL' } });
        const request = await prisma.request.findFirst();
        const quote = await prisma.quote.findFirst();
        
        if (client && professional) {
          // Crea alcuni pagamenti di esempio
          const paymentTypes = ['DEPOSIT', 'FINAL_PAYMENT', 'FULL_PAYMENT'];
          const statuses = ['PENDING', 'COMPLETED', 'COMPLETED'];
          
          for (let i = 0; i < 3; i++) {
            const amount = (i + 1) * 100; // €100, €200, €300
            const payment = await prisma.payment.create({
              data: {
                clientId: client.id,
                professionalId: professional.id,
                requestId: request?.id,
                quoteId: quote?.id,
                amount,
                currency: 'EUR',
                type: paymentTypes[i] as any,
                status: statuses[i] as any,
                method: 'CARD',
                stripePaymentId: `pi_test_${Date.now()}_${i}`,
                description: `Pagamento di esempio ${i + 1}`,
                platformFee: amount * 0.15,
                platformFeePercentage: 15,
                professionalAmount: amount * 0.85,
                metadata: {
                  test: true,
                  example: true
                }
              }
            });
            
            // Se il pagamento è completato, crea anche una fattura
            if (statuses[i] === 'COMPLETED') {
              await prisma.invoice.create({
                data: {
                  invoiceNumber: `INV-2025-${String(i + 1).padStart(5, '0')}`,
                  documentType: 'INVOICE',
                  status: 'PAID',
                  customerId: client.id,
                  professionalId: professional.id,
                  requestId: request?.id,
                  quoteId: quote?.id,
                  paymentId: payment.id,
                  subtotal: amount / 1.22,
                  taxRate: 22,
                  taxAmount: amount - (amount / 1.22),
                  totalAmount: amount,
                  paidAmount: amount,
                  lineItems: [
                    {
                      description: `Servizio assistenza ${i + 1}`,
                      quantity: 1,
                      unitPrice: amount / 1.22,
                      total: amount / 1.22
                    }
                  ],
                  customerData: {
                    name: `${client.firstName} ${client.lastName}`,
                    email: client.email,
                    address: client.address || 'Via Roma 1, 00100 Roma'
                  },
                  paidDate: new Date()
                }
              });
            }
          }
          
          console.log('✅ Creati 3 pagamenti di esempio');
          console.log('✅ Create 2 fatture di esempio');
          
          // Crea un payout di esempio
          if (professional) {
            await prisma.payout.create({
              data: {
                professionalId: professional.id,
                status: 'PENDING',
                paymentMethod: 'BANK_TRANSFER',
                periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                periodEnd: new Date(),
                totalEarned: 500,
                platformFee: 75,
                netPayout: 425,
                notes: 'Payout settimanale di esempio'
              }
            });
            console.log('✅ Creato 1 payout di esempio');
          }
        } else {
          console.log('⚠️ Nessun utente trovato per creare dati di esempio');
          console.log('   Esegui prima: npx prisma db seed');
        }
      }
    }
    
    // 4. Riepilogo finale
    console.log('\n' + '=' .repeat(50));
    console.log('✅ SETUP COMPLETATO CON SUCCESSO!\n');
    
    console.log('📊 Riepilogo configurazione:');
    console.log(`   - Modalità: ${isTestMode ? '🧪 TEST' : '🔴 LIVE'}`);
    console.log(`   - Secret Key: ${secretKey.substring(0, 20)}...`);
    console.log(`   - Public Key: ${publicKey.substring(0, 20)}...`);
    console.log(`   - Webhook: ${webhookSecret ? 'Configurato' : 'Non configurato'}`);
    
    console.log('\n📝 Prossimi passi:');
    console.log('1. Testa il sistema: npx ts-node src/scripts/test-payment-system.ts');
    console.log('2. Avvia il backend: npm run dev');
    console.log('3. Accedi alla dashboard: http://localhost:5193/admin/payments');
    
    if (!webhookSecret) {
      console.log('\n⚠️ Webhook non configurato:');
      console.log('   1. Vai su https://dashboard.stripe.com/webhooks');
      console.log('   2. Crea un endpoint: https://tuodominio.com/api/payments/webhook');
      console.log('   3. Seleziona eventi: payment_intent.succeeded, payment_intent.failed');
      console.log('   4. Salva il webhook secret e riesegui questo script');
    }
    
  } catch (error: any) {
    console.error('\n❌ ERRORE:', error.message);
    console.error('Dettagli:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
console.log('Sistema Richiesta Assistenza - Setup Pagamenti v5.1');
setupPaymentSystem()
  .then(() => {
    console.log('\n✅ Setup completato!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup fallito:', error);
    process.exit(1);
  });
