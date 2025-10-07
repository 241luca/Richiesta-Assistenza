/**
 * Script per creare pagamenti di test nel database
 * Data: 29/01/2025
 */

import { PrismaClient } from '@prisma/client';
import { subDays, subHours } from 'date-fns';

const prisma = new PrismaClient();

async function createTestPayments() {
  console.log('🔄 Creazione pagamenti di test...');

  try {
    // Trova utenti esistenti
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      take: 3
    });

    const professionals = await prisma.user.findMany({
      where: { role: 'PROFESSIONAL' },
      take: 2
    });

    if (clients.length === 0 || professionals.length === 0) {
      console.log('❌ Non ci sono abbastanza utenti. Creane alcuni prima.');
      return;
    }

    const client1 = clients[0];
    const client2 = clients[1] || clients[0];
    const client3 = clients[2] || clients[0];
    const prof1 = professionals[0];
    const prof2 = professionals[1] || professionals[0];

    // Array di pagamenti da creare
    const payments = [
      {
        clientId: client1.id,
        professionalId: prof1.id,
        amount: 250.00,
        currency: 'EUR',
        type: 'FULL_PAYMENT' as const,
        status: 'COMPLETED' as const,
        paymentMethod: 'CARD' as const,
        totalAmount: 250.00,
        professionalAmount: 212.50,
        platformFee: 37.50,
        platformFeePercentage: 15,
        description: 'Riparazione caldaia - intervento urgente',
        requiresInvoice: true,
        paidAt: new Date('2025-09-15T10:30:00'),
        processedAt: new Date('2025-09-15T10:31:00'),
        createdAt: new Date('2025-09-15T10:00:00')
      },
      {
        clientId: client2.id,
        professionalId: prof1.id,
        amount: 850.00,
        currency: 'EUR',
        type: 'FINAL_PAYMENT' as const,
        status: 'COMPLETED' as const,
        paymentMethod: 'BANK_TRANSFER' as const,
        totalAmount: 850.00,
        professionalAmount: 722.50,
        platformFee: 127.50,
        platformFeePercentage: 15,
        description: 'Installazione condizionatore dual split',
        requiresInvoice: true,
        paidAt: new Date('2025-08-20T14:00:00'),
        processedAt: new Date('2025-08-22T09:00:00'),
        createdAt: new Date('2025-08-18T16:00:00')
      },
      {
        clientId: client1.id,
        professionalId: prof2.id,
        amount: 1500.00,
        currency: 'EUR',
        type: 'DEPOSIT' as const,
        status: 'COMPLETED' as const,
        paymentMethod: 'CARD' as const,
        totalAmount: 1500.00,
        professionalAmount: 1275.00,
        platformFee: 225.00,
        platformFeePercentage: 15,
        description: 'Acconto 30% ristrutturazione bagno',
        requiresInvoice: true,
        paidAt: new Date('2025-09-10T11:00:00'),
        processedAt: new Date('2025-09-10T11:01:00'),
        createdAt: new Date('2025-09-10T10:45:00')
      },
      {
        clientId: client3.id,
        professionalId: prof1.id,
        amount: 120.00,
        currency: 'EUR',
        type: 'FULL_PAYMENT' as const,
        status: 'PENDING' as const,
        paymentMethod: 'CARD' as const,
        totalAmount: 120.00,
        professionalAmount: 102.00,
        platformFee: 18.00,
        platformFeePercentage: 15,
        description: 'Riparazione lavastoviglie - in attesa di pagamento',
        requiresInvoice: false,
        createdAt: subHours(new Date(), 2)
      },
      {
        clientId: client2.id,
        professionalId: prof2.id,
        amount: 450.00,
        currency: 'EUR',
        type: 'FULL_PAYMENT' as const,
        status: 'FAILED' as const,
        paymentMethod: 'CARD' as const,
        totalAmount: 450.00,
        professionalAmount: 382.50,
        platformFee: 67.50,
        platformFeePercentage: 15,
        description: 'Imbiancatura appartamento - carta rifiutata',
        requiresInvoice: true,
        failedAt: new Date('2025-09-25T18:00:00'),
        createdAt: new Date('2025-09-25T17:45:00')
      },
      {
        clientId: client1.id,
        professionalId: prof1.id,
        amount: 300.00,
        currency: 'EUR',
        type: 'FULL_PAYMENT' as const,
        status: 'PARTIALLY_REFUNDED' as const,
        paymentMethod: 'CARD' as const,
        totalAmount: 300.00,
        professionalAmount: 255.00,
        platformFee: 45.00,
        platformFeePercentage: 15,
        description: 'Riparazione perdita acqua - rimborsato parzialmente per materiale non utilizzato',
        requiresInvoice: true,
        paidAt: new Date('2025-09-05T09:00:00'),
        processedAt: new Date('2025-09-05T09:01:00'),
        refundedAt: new Date('2025-09-08T14:00:00'),
        createdAt: new Date('2025-09-05T08:45:00')
      },
      {
        clientId: client3.id,
        professionalId: prof1.id,
        amount: 180.00,
        currency: 'EUR',
        type: 'FULL_PAYMENT' as const,
        status: 'COMPLETED' as const,
        paymentMethod: 'PAYPAL' as const,
        totalAmount: 180.00,
        professionalAmount: 153.00,
        platformFee: 27.00,
        platformFeePercentage: 15,
        description: 'Manutenzione caldaia annuale',
        requiresInvoice: true,
        paidAt: subDays(new Date(), 1),
        processedAt: subDays(new Date(), 1),
        createdAt: subDays(subHours(new Date(), 0.5), 1)
      },
      {
        clientId: client2.id,
        professionalId: prof2.id,
        amount: 90.00,
        currency: 'EUR',
        type: 'FULL_PAYMENT' as const,
        status: 'COMPLETED' as const,
        paymentMethod: 'CASH' as const,
        totalAmount: 90.00,
        professionalAmount: 76.50,
        platformFee: 13.50,
        platformFeePercentage: 15,
        description: 'Piccola riparazione idraulica - pagamento in contanti',
        requiresInvoice: false,
        paidAt: new Date('2025-09-12T17:30:00'),
        processedAt: new Date('2025-09-12T17:35:00'),
        createdAt: new Date('2025-09-12T17:00:00')
      },
      {
        clientId: client1.id,
        professionalId: prof2.id,
        amount: 500.00,
        currency: 'EUR',
        type: 'DEPOSIT' as const,
        status: 'COMPLETED' as const,
        paymentMethod: 'BANK_TRANSFER' as const,
        totalAmount: 500.00,
        professionalAmount: 425.00,
        platformFee: 75.00,
        platformFeePercentage: 15,
        description: 'Acconto installazione pannelli solari',
        requiresInvoice: true,
        paidAt: new Date('2025-09-22T10:00:00'),
        processedAt: new Date('2025-09-23T09:00:00'),
        createdAt: new Date('2025-09-21T15:00:00')
      },
      {
        clientId: client2.id,
        professionalId: prof1.id,
        amount: 320.00,
        currency: 'EUR',
        type: 'FULL_PAYMENT' as const,
        status: 'PROCESSING' as const,
        paymentMethod: 'BANK_TRANSFER' as const,
        totalAmount: 320.00,
        professionalAmount: 272.00,
        platformFee: 48.00,
        platformFeePercentage: 15,
        description: 'Sostituzione boiler - bonifico in elaborazione',
        requiresInvoice: true,
        createdAt: subHours(new Date(), 12)
      }
    ];

    // Crea i pagamenti
    for (const payment of payments) {
      await prisma.payment.create({
        data: payment
      });
    }

    console.log(`✅ Creati ${payments.length} pagamenti di test!`);

    // Crea un rimborso per il pagamento parzialmente rimborsato
    const partiallyRefunded = await prisma.payment.findFirst({
      where: { status: 'PARTIALLY_REFUNDED' }
    });

    if (partiallyRefunded) {
      await prisma.refund.create({
        data: {
          paymentId: partiallyRefunded.id,
          amount: 50.00,
          currency: 'EUR',
          reason: 'Materiale non utilizzato restituito',
          reasonCode: 'REQUESTED_BY_CUSTOMER',
          status: 'COMPLETED',
          requestedAt: new Date('2025-09-08T10:00:00'),
          processedAt: new Date('2025-09-08T14:00:00'),
          completedAt: new Date('2025-09-08T14:05:00')
        }
      });
      console.log('✅ Creato 1 rimborso di test');
    }

    // Mostra statistiche
    const stats = await prisma.payment.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        amount: true
      }
    });

    console.log('\n📊 Statistiche pagamenti creati:');
    console.log('================================');
    stats.forEach(stat => {
      console.log(`${stat.status}: ${stat._count} pagamenti, totale €${stat._sum.amount || 0}`);
    });

  } catch (error) {
    console.error('❌ Errore nella creazione dei pagamenti:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
createTestPayments()
  .then(() => console.log('\n✨ Script completato!'))
  .catch(console.error);
