/**
 * Script per configurare le chiavi Stripe e inserire dati di test realistici
 * Data: 29/01/2025
 */

import { PrismaClient } from '@prisma/client';
import { format, subDays, subMonths } from 'date-fns';

const prisma = new PrismaClient();

async function setupStripeKeys() {
  console.log('🔑 Configurazione chiavi Stripe nel database...\n');

  // Inserisco chiavi di test Stripe (non reali ma formattate correttamente)
  const stripeKeys = [
    {
      id: 'stripe-secret-key',
      service: 'STRIPE',
      name: 'Stripe Secret Key',
      key: 'sk_test_51ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890',
      isActive: true,
      permissions: {
        environment: 'test',
        capabilities: ['payments', 'refunds', 'payouts', 'webhooks']
      },
      rateLimit: 10000
    },
    {
      id: 'stripe-public-key',
      service: 'STRIPE_PUBLIC',
      name: 'Stripe Publishable Key',
      key: 'pk_test_51ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890',
      isActive: true,
      permissions: {
        environment: 'test',
        public: true
      },
      rateLimit: 10000
    },
    {
      id: 'stripe-webhook-secret',
      service: 'STRIPE_WEBHOOK',
      name: 'Stripe Webhook Secret',
      key: 'whsec_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890',
      isActive: true,
      permissions: {
        environment: 'test',
        type: 'webhook'
      },
      rateLimit: 10000
    }
  ];

  for (const key of stripeKeys) {
    try {
      await prisma.apiKey.upsert({
        where: { service: key.service },
        update: {
          key: key.key,
          isActive: key.isActive,
          permissions: key.permissions,
          updatedAt: new Date()
        },
        create: key
      });
      console.log(`✅ ${key.name} configurata`);
    } catch (error) {
      console.log(`⚠️ Errore per ${key.name}:`, error.message);
    }
  }

  console.log('\n✅ Chiavi Stripe configurate nel database\n');
}

async function insertRealisticPayments() {
  console.log('💰 Inserimento pagamenti realistici...\n');

  // Prima ottengo alcuni utenti e preventivi esistenti
  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    take: 5
  });

  const professionals = await prisma.user.findMany({
    where: { role: 'PROFESSIONAL' },
    take: 3
  });

  const quotes = await prisma.quote.findMany({
    take: 10
  });

  if (clients.length === 0 || professionals.length === 0) {
    console.log('⚠️ Nessun cliente o professionista trovato. Creo utenti di test...');
    
    // Crea un cliente di test
    const testClient = await prisma.user.create({
      data: {
        email: 'cliente.test@example.com',
        password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXe.PaROVh.0hFKduPdI/70S.kRe.eKtCW', // password
        firstName: 'Mario',
        lastName: 'Rossi',
        role: 'CLIENT',
        emailVerified: true,
        isActive: true,
        phoneNumber: '+393331234567',
        address: 'Via Roma 123, Milano',
        city: 'Milano',
        postalCode: '20121'
      }
    });
    clients.push(testClient);

    // Crea un professionista di test
    const testProfessional = await prisma.user.create({
      data: {
        email: 'professionista.test@example.com',
        password: '$2b$10$EixZaYVK1fsbw1ZfbX3OXe.PaROVh.0hFKduPdI/70S.kRe.eKtCW', // password
        firstName: 'Giuseppe',
        lastName: 'Verdi',
        role: 'PROFESSIONAL',
        emailVerified: true,
        isActive: true,
        phoneNumber: '+393337654321',
        address: 'Via Milano 456, Roma',
        city: 'Roma',
        postalCode: '00100'
      }
    });
    professionals.push(testProfessional);
  }

  // Dati realistici per i pagamenti
  const paymentData = [
    {
      amount: 150.00,
      type: 'DEPOSIT',
      method: 'CARD',
      status: 'COMPLETED',
      description: 'Acconto per riparazione caldaia',
      transactionId: 'TRX-2025-001',
      stripePaymentId: 'pi_test_caldaia001',
      processedAt: subDays(new Date(), 5)
    },
    {
      amount: 350.00,
      type: 'FULL_PAYMENT',
      method: 'CARD',
      status: 'COMPLETED',
      description: 'Saldo riparazione caldaia',
      transactionId: 'TRX-2025-002',
      stripePaymentId: 'pi_test_caldaia002',
      processedAt: subDays(new Date(), 3)
    },
    {
      amount: 85.00,
      type: 'FULL_PAYMENT',
      method: 'BANK_TRANSFER',
      status: 'COMPLETED',
      description: 'Manutenzione condizionatore',
      transactionId: 'TRX-2025-003',
      processedAt: subDays(new Date(), 10)
    },
    {
      amount: 220.00,
      type: 'DEPOSIT',
      method: 'CARD',
      status: 'PENDING',
      description: 'Acconto installazione impianto elettrico',
      transactionId: 'TRX-2025-004',
      stripePaymentId: 'pi_test_elettrico001'
    },
    {
      amount: 1250.00,
      type: 'FULL_PAYMENT',
      method: 'CARD',
      status: 'COMPLETED',
      description: 'Ristrutturazione bagno completa',
      transactionId: 'TRX-2025-005',
      stripePaymentId: 'pi_test_bagno001',
      processedAt: subDays(new Date(), 15)
    },
    {
      amount: 75.00,
      type: 'FULL_PAYMENT',
      method: 'CASH',
      status: 'COMPLETED',
      description: 'Riparazione perdita rubinetto',
      transactionId: 'TRX-2025-006',
      processedAt: subDays(new Date(), 7)
    },
    {
      amount: 450.00,
      type: 'PARTIAL',
      method: 'CARD',
      status: 'COMPLETED',
      description: 'Prima rata tinteggiatura appartamento',
      transactionId: 'TRX-2025-007',
      stripePaymentId: 'pi_test_tinteggiatura001',
      processedAt: subDays(new Date(), 20)
    },
    {
      amount: 180.00,
      type: 'FULL_PAYMENT',
      method: 'CARD',
      status: 'REFUNDED',
      description: 'Intervento annullato - cambio serratura',
      transactionId: 'TRX-2025-008',
      stripePaymentId: 'pi_test_serratura001',
      processedAt: subDays(new Date(), 12)
    },
    {
      amount: 95.00,
      type: 'FULL_PAYMENT',
      method: 'CARD',
      status: 'COMPLETED',
      description: 'Pulizia grondaie',
      transactionId: 'TRX-2025-009',
      stripePaymentId: 'pi_test_grondaie001',
      processedAt: subDays(new Date(), 2)
    },
    {
      amount: 320.00,
      type: 'DEPOSIT',
      method: 'BANK_TRANSFER',
      status: 'PENDING',
      description: 'Acconto sostituzione infissi',
      transactionId: 'TRX-2025-010'
    }
  ];

  let createdCount = 0;
  
  for (let i = 0; i < paymentData.length; i++) {
    const data = paymentData[i];
    const client = clients[i % clients.length];
    const professional = professionals[i % professionals.length];
    const quote = quotes[i] || null;

    try {
      // Crea il pagamento
      const payment = await prisma.payment.create({
        data: {
          userId: client.id,
          amount: data.amount,
          currency: 'EUR',
          type: data.type as any,
          method: data.method as any,
          status: data.status as any,
          description: data.description,
          transactionId: data.transactionId,
          stripePaymentId: data.stripePaymentId || null,
          processedAt: data.processedAt || null,
          quoteId: quote?.id || null,
          metadata: {
            professionalId: professional.id,
            professionalName: `${professional.firstName} ${professional.lastName}`,
            clientName: `${client.firstName} ${client.lastName}`
          }
        }
      });

      // Se il pagamento è completato, crea anche il PaymentSplit
      if (payment.status === 'COMPLETED') {
        const platformFee = payment.amount * 0.15; // 15% commissione
        const netAmount = payment.amount - platformFee;

        await prisma.paymentSplit.create({
          data: {
            paymentId: payment.id,
            professionalId: professional.id,
            grossAmount: payment.amount,
            platformFee: platformFee,
            platformFeePercent: 15,
            netAmount: netAmount,
            splitType: 'DEFERRED',
            payoutStatus: 'PENDING',
            appliedRules: {
              feeType: 'percentage',
              feeValue: 15,
              calculatedAt: new Date()
            }
          }
        });

        // Crea anche il ProfessionalPayment
        await prisma.professionalPayment.create({
          data: {
            professionalId: professional.id,
            paymentId: payment.id,
            grossAmount: payment.amount,
            platformFee: platformFee,
            platformFeePercent: 15,
            netAmount: netAmount,
            payoutStatus: 'PENDING',
            metadata: {
              serviceName: data.description,
              clientName: `${client.firstName} ${client.lastName}`
            }
          }
        });
      }

      // Se il pagamento è REFUNDED, crea un rimborso
      if (data.status === 'REFUNDED') {
        await prisma.refund.create({
          data: {
            paymentId: payment.id,
            amount: payment.amount,
            currency: 'EUR',
            reason: 'Servizio annullato dal cliente',
            reasonCode: 'REQUESTED_BY_CUSTOMER',
            status: 'COMPLETED',
            stripeRefundId: `re_test_${payment.id}`,
            processedAt: new Date(),
            completedAt: new Date()
          }
        });
      }

      createdCount++;
      console.log(`✅ Pagamento ${data.transactionId}: €${data.amount} - ${data.description}`);
      
    } catch (error) {
      console.log(`⚠️ Errore creazione pagamento:`, error.message);
    }
  }

  console.log(`\n✅ Creati ${createdCount} pagamenti realistici\n`);

  // Mostra statistiche
  const stats = await prisma.payment.aggregate({
    _count: true,
    _sum: {
      amount: true
    },
    where: {
      status: 'COMPLETED'
    }
  });

  console.log('📊 Statistiche pagamenti:');
  console.log(`   - Totale pagamenti: ${stats._count}`);
  console.log(`   - Importo totale: €${stats._sum.amount?.toFixed(2) || '0.00'}`);
  
  const platformRevenue = (stats._sum.amount || 0) * 0.15;
  console.log(`   - Revenue piattaforma (15%): €${platformRevenue.toFixed(2)}`);
}

async function createInvoices() {
  console.log('\n📄 Creazione fatture per i pagamenti completati...\n');

  // Ottieni i pagamenti completati che non hanno fatture
  const completedPayments = await prisma.payment.findMany({
    where: {
      status: 'COMPLETED',
      invoices: {
        none: {}
      }
    },
    include: {
      user: true
    }
  });

  let invoiceCount = 0;
  const currentYear = new Date().getFullYear();

  for (const payment of completedPayments) {
    try {
      invoiceCount++;
      
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `${currentYear}/${String(invoiceCount).padStart(5, '0')}`,
          type: 'INVOICE',
          status: 'ISSUED',
          issueDate: payment.processedAt || payment.createdAt,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
          paymentId: payment.id,
          userId: payment.userId,
          customerName: `${payment.user.firstName} ${payment.user.lastName}`,
          customerEmail: payment.user.email,
          customerAddress: payment.user.address || 'Via da definire',
          customerCity: payment.user.city || 'Città',
          customerPostalCode: payment.user.postalCode || '00000',
          customerCountry: 'IT',
          customerVatNumber: payment.user.vatNumber || null,
          customerFiscalCode: payment.user.fiscalCode || null,
          lineItems: [
            {
              description: payment.description || 'Servizio assistenza',
              quantity: 1,
              unitPrice: payment.amount / 1.22, // Scorporo IVA
              vatRate: 22,
              totalPrice: payment.amount
            }
          ],
          subtotal: payment.amount / 1.22,
          taxRate: 22,
          taxAmount: payment.amount - (payment.amount / 1.22),
          totalAmount: payment.amount,
          currency: 'EUR',
          paymentStatus: 'PAID',
          paymentMethod: payment.method || 'CARD',
          paidAt: payment.processedAt,
          metadata: {
            paymentId: payment.id,
            autoGenerated: true
          }
        }
      });

      console.log(`✅ Fattura ${invoice.invoiceNumber} creata per €${invoice.totalAmount}`);
      
    } catch (error) {
      console.log(`⚠️ Errore creazione fattura:`, error.message);
    }
  }

  console.log(`\n✅ Create ${invoiceCount} fatture\n`);
}

async function setupPaymentSettings() {
  console.log('⚙️ Configurazione impostazioni pagamento professionisti...\n');

  const professionals = await prisma.user.findMany({
    where: { role: 'PROFESSIONAL' }
  });

  for (const prof of professionals) {
    try {
      await prisma.professionalPaymentSettings.create({
        data: {
          professionalId: prof.id,
          paymentMode: 'MANAGED',
          payoutFrequency: 'WEEKLY',
          payoutDay: 5, // Venerdì
          minimumPayout: 50.00,
          holdingDays: 7,
          autoPayout: true,
          requireApproval: false,
          paymentMethods: {
            preferred: 'bank_transfer',
            available: ['bank_transfer', 'paypal']
          },
          bankDetails: {
            iban: 'IT60X0542811101000000123456',
            bic: 'BLOPIT22',
            accountHolder: `${prof.firstName} ${prof.lastName}`
          },
          useStandardFees: true,
          volumeTiers: [
            { from: 0, to: 1000, feePercent: 15 },
            { from: 1000, to: 5000, feePercent: 12 },
            { from: 5000, to: null, feePercent: 10 }
          ]
        }
      });
      
      console.log(`✅ Impostazioni pagamento create per ${prof.firstName} ${prof.lastName}`);
    } catch (error) {
      // Ignora se già esistono
      if (!error.message.includes('Unique constraint')) {
        console.log(`⚠️ Errore:`, error.message);
      }
    }
  }

  console.log('\n✅ Impostazioni pagamento configurate\n');
}

async function main() {
  console.log('===========================================');
  console.log('   CONFIGURAZIONE SISTEMA PAGAMENTI');
  console.log('===========================================\n');

  try {
    // 1. Configura chiavi Stripe
    await setupStripeKeys();

    // 2. Inserisci pagamenti realistici
    await insertRealisticPayments();

    // 3. Crea fatture per i pagamenti
    await createInvoices();

    // 4. Configura impostazioni professionisti
    await setupPaymentSettings();

    console.log('===========================================');
    console.log('✅ CONFIGURAZIONE COMPLETATA CON SUCCESSO');
    console.log('===========================================\n');
    
    console.log('🎯 Prossimi passi:');
    console.log('   1. Vai su http://localhost:5193/admin/payments');
    console.log('   2. Verifica i pagamenti inseriti');
    console.log('   3. Testa la creazione di un nuovo pagamento');
    console.log('   4. Verifica le fatture generate\n');

  } catch (error) {
    console.error('❌ Errore generale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
