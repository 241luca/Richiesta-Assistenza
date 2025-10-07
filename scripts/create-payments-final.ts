/**
 * Script FINALE per creare pagamenti di test
 * Include il campo type obbligatorio
 */

import { PrismaClient } from '@prisma/client';
import { subDays, subHours } from 'date-fns';

const prisma = new PrismaClient();

async function createTestPayments() {
  console.log('🔄 Creazione pagamenti di test CON TYPE...');

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
      console.log('❌ Non ci sono abbastanza utenti.');
      return;
    }

    const client1 = clients[0];
    const client2 = clients[1] || clients[0];
    const client3 = clients[2] || clients[0];

    console.log('👤 Clienti:', clients.map(c => c.email).join(', '));

    // Pagamenti con TYPE incluso (usando DEPOSIT che dovrebbe esistere)
    const paymentsData = [
      {
        userId: client1.id,
        amount: 250.00,
        currency: 'EUR',
        type: 'DEPOSIT', // Usiamo DEPOSIT che è comune
        status: 'COMPLETED',
        description: 'Riparazione caldaia - intervento urgente',
        processedAt: new Date('2025-09-15T10:31:00'),
        createdAt: new Date('2025-09-15T10:00:00')
      },
      {
        userId: client2.id,
        amount: 850.00,
        currency: 'EUR',
        type: 'DEPOSIT',
        status: 'COMPLETED',
        description: 'Installazione condizionatore dual split',
        processedAt: new Date('2025-08-22T09:00:00'),
        createdAt: new Date('2025-08-18T16:00:00')
      },
      {
        userId: client1.id,
        amount: 1500.00,
        currency: 'EUR',
        type: 'DEPOSIT',
        status: 'COMPLETED',
        description: 'Acconto 30% ristrutturazione bagno',
        processedAt: new Date('2025-09-10T11:01:00'),
        createdAt: new Date('2025-09-10T10:45:00')
      },
      {
        userId: client3.id,
        amount: 120.00,
        currency: 'EUR',
        type: 'DEPOSIT',
        status: 'PENDING',
        description: 'Riparazione lavastoviglie - in attesa',
        createdAt: subHours(new Date(), 2)
      },
      {
        userId: client2.id,
        amount: 450.00,
        currency: 'EUR',
        type: 'DEPOSIT',
        status: 'FAILED',
        description: 'Imbiancatura - carta rifiutata',
        createdAt: new Date('2025-09-25T17:45:00')
      },
      {
        userId: client1.id,
        amount: 300.00,
        currency: 'EUR',
        type: 'DEPOSIT',
        status: 'PARTIALLY_REFUNDED',
        description: 'Riparazione perdita - rimborsato parzialmente',
        processedAt: new Date('2025-09-05T09:01:00'),
        createdAt: new Date('2025-09-05T08:45:00')
      },
      {
        userId: client3.id,
        amount: 180.00,
        currency: 'EUR',
        type: 'DEPOSIT',
        status: 'COMPLETED',
        description: 'Manutenzione caldaia annuale',
        processedAt: subDays(new Date(), 1),
        createdAt: subDays(subHours(new Date(), 0.5), 1)
      },
      {
        userId: client2.id,
        amount: 90.00,
        currency: 'EUR',
        type: 'DEPOSIT',
        status: 'COMPLETED',
        description: 'Riparazione idraulica',
        processedAt: new Date('2025-09-12T17:35:00'),
        createdAt: new Date('2025-09-12T17:00:00')
      },
      {
        userId: client1.id,
        amount: 500.00,
        currency: 'EUR',
        type: 'DEPOSIT',
        status: 'COMPLETED',
        description: 'Acconto pannelli solari',
        processedAt: new Date('2025-09-23T09:00:00'),
        createdAt: new Date('2025-09-21T15:00:00')
      },
      {
        userId: client2.id,
        amount: 320.00,
        currency: 'EUR',
        type: 'DEPOSIT',
        status: 'PROCESSING',
        description: 'Sostituzione boiler - in elaborazione',
        createdAt: subHours(new Date(), 12)
      }
    ];

    // Crea i pagamenti
    let created = 0;
    let errors = 0;
    
    for (const paymentData of paymentsData) {
      try {
        const payment = await prisma.payment.create({
          data: paymentData
        });
        created++;
        console.log(`✅ Creato: €${payment.amount} - ${payment.status}`);
      } catch (error: any) {
        errors++;
        // Se DEPOSIT non funziona, proviamo altri valori
        if (error.message.includes('Invalid value')) {
          console.log('⚠️ Provo con type diverso...');
          try {
            const payment = await prisma.payment.create({
              data: {
                ...paymentData,
                type: 'PAYMENT' // Prova alternativa
              }
            });
            created++;
            console.log(`✅ Creato (alt): €${payment.amount}`);
          } catch (error2: any) {
            console.log(`❌ Fallito anche con PAYMENT: ${error2.message.split('\n')[0]}`);
          }
        }
      }
    }

    console.log(`\n📊 RISULTATO: ${created} creati, ${errors} errori`);

    // Statistiche finali
    const total = await prisma.payment.count();
    const sum = await prisma.payment.aggregate({
      _sum: { amount: true }
    });

    console.log(`\n💰 TOTALE DATABASE: ${total} pagamenti, €${sum._sum.amount || 0}`);

    // Mostra per stato
    const byStatus = await prisma.payment.groupBy({
      by: ['status'],
      _count: true
    });

    console.log('\nPer stato:');
    byStatus.forEach(s => {
      console.log(`  ${s.status}: ${s._count}`);
    });

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPayments().catch(console.error);
