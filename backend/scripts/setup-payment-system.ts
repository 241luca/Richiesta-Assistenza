/**
 * Script per configurare il sistema di pagamento
 * Data: 29/01/2025
 * 
 * Questo script:
 * 1. Inserisce le chiavi Stripe di test nel database
 * 2. Crea pagamenti di esempio realistici
 * 3. Configura le impostazioni dei professionisti
 * 4. Genera fatture di esempio
 */

import { prisma } from '../src/config/database';
import { PaymentStatus, PaymentType, PaymentMethod, InvoiceStatus, InvoiceType } from '@prisma/client';
import { subDays, subMonths } from 'date-fns';
import { randomBytes } from 'crypto';

// Genera un ID univoco
function generateId(): string {
  return randomBytes(16).toString('hex');
}

async function setupPaymentSystem() {
  console.log('🚀 Configurazione Sistema Pagamento...\n');

  try {
    // ========================================
    // 1. CONFIGURAZIONE API KEYS STRIPE
    // ========================================
    console.log('1️⃣ Configurazione chiavi Stripe...');
    
    // Chiave segreta Stripe (di test)
    const stripeSecretKey = await prisma.apiKey.upsert({
      where: { service: 'STRIPE' },
      update: {
        key: 'sk_test_51ABcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZ',
        name: 'Stripe Secret Key (Test)',
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        id: generateId(),
        service: 'STRIPE',
        key: 'sk_test_51ABcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZ',
        name: 'Stripe Secret Key (Test)',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    // Chiave pubblica Stripe (di test)
    const stripePublicKey = await prisma.apiKey.upsert({
      where: { service: 'STRIPE_PUBLIC' },
      update: {
        key: 'pk_test_51ABcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZ',
        name: 'Stripe Public Key (Test)',
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        id: generateId(),
        service: 'STRIPE_PUBLIC',
        key: 'pk_test_51ABcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZ',
        name: 'Stripe Public Key (Test)',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    // Webhook Secret Stripe
    const stripeWebhookSecret = await prisma.apiKey.upsert({
      where: { service: 'STRIPE_WEBHOOK' },
      update: {
        key: 'whsec_1234567890abcdefghijklmnopqrstuvwxyz',
        name: 'Stripe Webhook Secret (Test)',
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        id: generateId(),
        service: 'STRIPE_WEBHOOK',
        key: 'whsec_1234567890abcdefghijklmnopqrstuvwxyz',
        name: 'Stripe Webhook Secret (Test)',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log('✅ Chiavi Stripe configurate\n');

    // ========================================
    // 2. OTTIENI UTENTI DI TEST
    // ========================================
    console.log('2️⃣ Ricerca utenti di test...');
    
    // Trova un cliente di test
    const client = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });

    // Trova professionisti di test
    const professionals = await prisma.user.findMany({
      where: { role: 'PROFESSIONAL' },
      take: 3
    });

    if (!client || professionals.length === 0) {
      console.log('⚠️ Nessun utente di test trovato. Creazione utenti...');
      
      // Crea un cliente se non esiste
      const newClient = await prisma.user.create({
        data: {
          email: 'cliente.test@example.com',
          password: '$2a$10$test', // Password hash fittizio
          firstName: 'Mario',
          lastName: 'Rossi',
          role: 'CLIENT',
          isEmailVerified: true,
          address: 'Via Roma 123, Milano',
          city: 'Milano',
          postalCode: '20100',
          phone: '+39 333 1234567',
          latitude: 45.4642,
          longitude: 9.1900,
        }
      });

      // Crea professionisti se non esistono
      const prof1 = await prisma.user.create({
        data: {
          email: 'idraulico.test@example.com',
          password: '$2a$10$test',
          firstName: 'Giuseppe',
          lastName: 'Verdi',
          role: 'PROFESSIONAL',
          isEmailVerified: true,
          address: 'Via Garibaldi 45, Milano',
          city: 'Milano',
          postalCode: '20121',
          phone: '+39 333 2345678',
          latitude: 45.4650,
          longitude: 9.1850,
        }
      });

      const prof2 = await prisma.user.create({
        data: {
          email: 'elettricista.test@example.com',
          password: '$2a$10$test',
          firstName: 'Luigi',
          lastName: 'Bianchi',
          role: 'PROFESSIONAL',
          isEmailVerified: true,
          address: 'Corso Buenos Aires 20, Milano',
          city: 'Milano',
          postalCode: '20124',
          phone: '+39 333 3456789',
          latitude: 45.4780,
          longitude: 9.2100,
        }
      });

      professionals.push(prof1, prof2);
    }

    const clientId = client?.id || professionals[0].id;
    const professionalId = professionals[0]?.id;

    console.log(`✅ Trovati ${professionals.length} professionisti e 1 cliente\n`);

    // ========================================
    // 3. CONFIGURAZIONE PROFESSIONISTI
    // ========================================
    console.log('3️⃣ Configurazione impostazioni pagamento professionisti...');

    for (const professional of professionals) {
      await prisma.professionalPaymentSettings.upsert({
        where: { professionalId: professional.id },
        update: {
          paymentMode: 'MANAGED',
          payoutFrequency: 'WEEKLY',
          minimumPayout: 50.00,
          holdingDays: 7,
          autoPayout: true,
          useStandardFees: true,
        },
        create: {
          professionalId: professional.id,
          paymentMode: 'MANAGED',
          payoutFrequency: 'WEEKLY',
          payoutDay: 5, // Venerdì
          minimumPayout: 50.00,
          holdingDays: 7,
          autoPayout: true,
          requireApproval: false,
          useStandardFees: true,
          customFees: {
            baseFee: 15, // 15% commissione base
            volumeDiscounts: [
              { from: 0, to: 1000, discount: 0 },
              { from: 1000, to: 5000, discount: 2 },
              { from: 5000, to: 10000, discount: 5 },
              { from: 10000, to: null, discount: 10 }
            ]
          },
          maxTransaction: 5000.00,
          maxDaily: 10000.00,
          maxMonthly: 50000.00,
        }
      });
    }

    console.log('✅ Impostazioni professionisti configurate\n');

    // ========================================
    // 4. CREAZIONE PAGAMENTI DI ESEMPIO
    // ========================================
    console.log('4️⃣ Creazione pagamenti di esempio...');

    // Prima controlla se ci sono già pagamenti
    const existingPayments = await prisma.payment.findMany();
    
    if (existingPayments.length > 0) {
      console.log(`   ⚠️  Trovati ${existingPayments.length} pagamenti esistenti, skip creazione`);
    } else {

    const paymentData = [
      // Pagamenti completati
      {
        amount: 250.00,
        type: 'FINAL_PAYMENT' as PaymentType,
        status: 'COMPLETED' as PaymentStatus,
        paymentMethod: 'CARD' as PaymentMethod,
        description: 'Riparazione perdita lavandino',
        processedAt: subDays(new Date(), 2),
        createdAt: subDays(new Date(), 3),
        stripePaymentId: 'pi_test_completed_001',
      },
      {
        amount: 150.00,
        type: 'DEPOSIT' as PaymentType,
        status: 'COMPLETED' as PaymentStatus,
        paymentMethod: 'CARD' as PaymentMethod,
        description: 'Acconto impianto elettrico',
        processedAt: subDays(new Date(), 5),
        createdAt: subDays(new Date(), 6),
        stripePaymentId: 'pi_test_completed_002',
      },
      {
        amount: 480.00,
        type: 'FINAL_PAYMENT' as PaymentType,
        status: 'COMPLETED' as PaymentStatus,
        paymentMethod: 'BANK_TRANSFER' as PaymentMethod,
        description: 'Installazione caldaia',
        processedAt: subDays(new Date(), 10),
        createdAt: subDays(new Date(), 12),
        stripePaymentId: 'pi_test_completed_003',
      },
      // Pagamenti in attesa
      {
        amount: 320.00,
        type: 'FINAL_PAYMENT' as PaymentType,
        status: 'PENDING' as PaymentStatus,
        paymentMethod: 'CARD' as PaymentMethod,
        description: 'Riparazione climatizzatore',
        createdAt: subDays(new Date(), 1),
        stripePaymentId: 'pi_test_pending_004',
      },
      // Pagamento fallito
      {
        amount: 200.00,
        type: 'FINAL_PAYMENT' as PaymentType,
        status: 'FAILED' as PaymentStatus,
        paymentMethod: 'CARD' as PaymentMethod,
        description: 'Sostituzione interruttore generale',
        createdAt: subDays(new Date(), 7),
        stripePaymentId: 'pi_test_failed_005',
      },
      // Pagamenti vecchi per statistiche
      {
        amount: 600.00,
        type: 'FINAL_PAYMENT' as PaymentType,
        status: 'COMPLETED' as PaymentStatus,
        paymentMethod: 'CARD' as PaymentMethod,
        description: 'Ristrutturazione bagno - fase 1',
        processedAt: subMonths(new Date(), 1),
        createdAt: subMonths(new Date(), 1),
        stripePaymentId: 'pi_test_old_001',
      },
      {
        amount: 450.00,
        type: 'FINAL_PAYMENT' as PaymentType,
        status: 'COMPLETED' as PaymentStatus,
        paymentMethod: 'CARD' as PaymentMethod,
        description: 'Manutenzione impianto idraulico',
        processedAt: subMonths(new Date(), 2),
        createdAt: subMonths(new Date(), 2),
        stripePaymentId: 'pi_test_old_002',
      }
    ];

    const createdPayments = [];
    
    for (const data of paymentData) {
      const payment = await prisma.payment.create({
        data: {
          ...data,
          clientId: clientId,  // Usa clientId invece di userId
          currency: 'EUR',
          totalAmount: data.amount, // totalAmount = amount per ora
          // Se il pagamento è completato, aggiungi paidAt
          paidAt: data.status === 'COMPLETED' ? data.processedAt : undefined,
        }
      });
      createdPayments.push(payment);
      
      // Per i pagamenti completati, crea anche il PaymentSplit
      if (payment.status === 'COMPLETED' && professionalId) {
        const platformFee = payment.amount * 0.15; // 15% commissione
        const netAmount = payment.amount - platformFee;
        
        await prisma.paymentSplit.create({
          data: {
            paymentId: payment.id,
            professionalId: professionalId,
            grossAmount: payment.amount,
            platformFee: platformFee,
            platformFeePercent: 15,
            netAmount: netAmount,
            splitType: 'DEFERRED',
            payoutStatus: 'PENDING',
            appliedRules: {
              baseFee: 15,
              volumeDiscount: 0,
              finalFee: 15
            },
            processedAt: payment.processedAt,
          }
        });
      }
    }

      console.log(`✅ Creati ${createdPayments.length} pagamenti di esempio\n`);
    }

    // ========================================
    // 5. CREAZIONE FATTURE DI ESEMPIO
    // ========================================
    console.log('5️⃣ Creazione fatture di esempio...');
    
    // Controlla se ci sono già fatture
    const existingInvoices = await prisma.invoice.findMany();
    
    if (existingInvoices.length > 0) {
      console.log(`   ⚠️  Trovate ${existingInvoices.length} fatture esistenti, skip creazione`);
    } else {
      // Usa i pagamenti esistenti se ci sono, altrimenti usa ID fittizi
      const payments = existingPayments.length > 0 ? existingPayments : createdPayments;

    const invoiceData = [
      {
        invoiceNumber: 'FAT-2025-001',
        documentType: 'INVOICE' as any,
        status: 'PAID' as any,
        dueDate: subDays(new Date(), -28),  // Solo dueDate, no issueDate
        customerName: 'Mario Rossi',
        customerEmail: 'mario.rossi@example.com',
        customerAddress: 'Via Roma 123, Milano',
        customerVatNumber: 'IT12345678901',
        subtotal: 250.00,
        taxRate: 22,
        taxAmount: 55.00,
        totalAmount: 305.00,
        paidAmount: 305.00,
        lineItems: [
          {
            description: 'Riparazione perdita lavandino',
            quantity: 1,
            unitPrice: 200.00,
            totalPrice: 200.00
          },
          {
            description: 'Materiali di consumo',
            quantity: 1,
            unitPrice: 50.00,
            totalPrice: 50.00
          }
        ],
          paymentId: payments[0]?.id,
      },
      {
        invoiceNumber: 'FAT-2025-002',
        documentType: 'INVOICE' as any,
        status: 'PAID' as any,
        dueDate: subDays(new Date(), -20),  // Solo dueDate
        customerName: 'Mario Rossi',
        customerEmail: 'mario.rossi@example.com',
        customerAddress: 'Via Roma 123, Milano',
        customerVatNumber: 'IT12345678901',
        subtotal: 480.00,
        taxRate: 22,
        taxAmount: 105.60,
        totalAmount: 585.60,
        paidAmount: 585.60,
        lineItems: [
          {
            description: 'Installazione caldaia',
            quantity: 1,
            unitPrice: 380.00,
            totalPrice: 380.00
          },
          {
            description: 'Tubazioni e raccordi',
            quantity: 1,
            unitPrice: 100.00,
            totalPrice: 100.00
          }
        ],
          paymentId: payments[2]?.id,
      },
      {
        invoiceNumber: 'FAT-2025-003',
        documentType: 'PROFORMA' as any,
        status: 'DRAFT' as any,
        dueDate: subDays(new Date(), -30),  // Solo dueDate
        customerName: 'Mario Rossi',
        customerEmail: 'mario.rossi@example.com',
        customerAddress: 'Via Roma 123, Milano',
        subtotal: 320.00,
        taxRate: 22,
        taxAmount: 70.40,
        totalAmount: 390.40,
        paidAmount: 0,
        lineItems: [
          {
            description: 'Riparazione climatizzatore',
            quantity: 1,
            unitPrice: 250.00,
            totalPrice: 250.00
          },
          {
            description: 'Ricarica gas refrigerante',
            quantity: 1,
            unitPrice: 70.00,
            totalPrice: 70.00
          }
        ],
      }
    ];

    for (const data of invoiceData) {
      // Prepara customerData come JSON
      const customerData = {
        name: data.customerName,
        email: data.customerEmail,
        address: data.customerAddress,
        vatNumber: data.customerVatNumber
      };
      
      // Rimuovi i campi che vanno in customerData dall'oggetto principale
      const { customerName, customerEmail, customerAddress, customerVatNumber, ...invoiceData } = data;
      
      await prisma.invoice.create({
        data: {
          ...invoiceData,
          customerId: clientId,  // Usa customerId invece di userId
          customerData: customerData as any,  // Aggiungi customerData come JSON
          lineItems: invoiceData.lineItems as any,
        }
      });
    }

      console.log(`✅ Create ${invoiceData.length} fatture di esempio\n`);
    }

    // ========================================
    // 6. CREAZIONE PAYOUT DI ESEMPIO
    // ========================================
    console.log('6️⃣ Creazione payout di esempio...');

    // Controlla se ci sono già payout
    const existingPayouts = await prisma.payout.findMany();
    
    if (existingPayouts.length > 0) {
      console.log(`   ⚠️  Trovati ${existingPayouts.length} payout esistenti, skip creazione`);
    } else if (professionalId) {
      // Payout processato
      await prisma.payout.create({
        data: {
          professionalId: professionalId,
          status: 'COMPLETED',
          paymentMethod: 'BANK_TRANSFER' as any,
          transactionRef: 'PAYOUT-2025-001',
          periodStart: subDays(new Date(), 14),
          periodEnd: subDays(new Date(), 7),
          totalEarned: 1000.00,
          platformFee: 150.00,
          netPayout: 850.00,
          paidAt: subDays(new Date(), 7),
          processedAt: subDays(new Date(), 7),
          notes: 'Payout settimanale - Gennaio 2025',
        }
      });

      // Payout in attesa
      await prisma.payout.create({
        data: {
          professionalId: professionalId,
          status: 'PENDING',
          paymentMethod: 'BANK_TRANSFER' as any,
          transactionRef: 'PAYOUT-2025-002',
          periodStart: subDays(new Date(), 7),
          periodEnd: new Date(),
          totalEarned: 500.00,
          platformFee: 80.00,
          netPayout: 420.00,
          scheduledAt: new Date(),
          notes: 'Payout settimanale - Gennaio 2025',
        }
      });
      console.log('✅ Payout di esempio creati\n');
    } else {
      console.log('   ⚠️  Nessun professionista trovato, skip payout\n');
    }

    // ========================================
    // 7. RIEPILOGO
    // ========================================
    console.log('=' .repeat(50));
    console.log('🎉 CONFIGURAZIONE COMPLETATA CON SUCCESSO!\n');
    console.log('Riepilogo:');
    console.log('- 3 API Keys Stripe configurate');
    console.log(`- ${professionals.length} professionisti configurati`);
    console.log(`- ${existingPayments.length || 7} pagamenti nel database`);
    console.log(`- ${existingInvoices.length || 3} fatture nel database`);
    console.log('- 2 payout creati');
    console.log('\n📌 Note:');
    console.log('- Le chiavi Stripe sono di TEST (non funzioneranno con Stripe reale)');
    console.log('- Quando avrai le vere chiavi, aggiornale nel database');
    console.log('- Il sistema è pronto per essere testato!');
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('❌ Errore durante la configurazione:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
setupPaymentSystem()
  .then(() => {
    console.log('\n✅ Script completato');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script fallito:', error);
    process.exit(1);
  });
