/**
 * Script CORRETTO per creare pagamenti di test nel database
 * Versione semplificata senza enum type
 */

import { PrismaClient } from '@prisma/client';
import { subDays, subHours } from 'date-fns';

const prisma = new PrismaClient();

async function createTestPayments() {
  console.log('🔄 Creazione pagamenti di test (versione corretta)...');

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
      console.log('❌ Non ci sono abbastanza utenti nel database.');
      console.log('Trovati:', clients.length, 'clienti e', professionals.length, 'professionisti');
      return;
    }

    const client1 = clients[0];
    const client2 = clients[1] || clients[0];
    const client3 = clients[2] || clients[0];
    const prof1 = professionals[0];
    const prof2 = professionals[1] || professionals[0];

    console.log('👤 Usando clienti:', clients.map(c => c.email).join(', '));
    console.log('👷 Usando professionisti:', professionals.map(p => p.email).join(', '));

    // Array di pagamenti SEMPLIFICATI - rimuoviamo i campi problematici
    const paymentsData = [
      {
        userId: client1.id,  // Usiamo userId invece di clientId
        amount: 250.00,
        currency: 'EUR',
        status: 'COMPLETED' as const,
        description: 'Riparazione caldaia - intervento urgente',
        processedAt: new Date('2025-09-15T10:31:00'),
        createdAt: new Date('2025-09-15T10:00:00')
      },
      {
        userId: client2.id,
        amount: 850.00,
        currency: 'EUR',
        status: 'COMPLETED' as const,
        description: 'Installazione condizionatore dual split',
        processedAt: new Date('2025-08-22T09:00:00'),
        createdAt: new Date('2025-08-18T16:00:00')
      },
      {
        userId: client1.id,
        amount: 1500.00,
        currency: 'EUR',
        status: 'COMPLETED' as const,
        description: 'Acconto 30% ristrutturazione bagno',
        processedAt: new Date('2025-09-10T11:01:00'),
        createdAt: new Date('2025-09-10T10:45:00')
      },
      {
        userId: client3.id,
        amount: 120.00,
        currency: 'EUR',
        status: 'PENDING' as const,
        description: 'Riparazione lavastoviglie - in attesa di pagamento',
        createdAt: subHours(new Date(), 2)
      },
      {
        userId: client2.id,
        amount: 450.00,
        currency: 'EUR',
        status: 'FAILED' as const,
        description: 'Imbiancatura appartamento - carta rifiutata',
        createdAt: new Date('2025-09-25T17:45:00')
      },
      {
        userId: client1.id,
        amount: 300.00,
        currency: 'EUR',
        status: 'PARTIALLY_REFUNDED' as const,
        description: 'Riparazione perdita acqua - rimborsato parzialmente',
        processedAt: new Date('2025-09-05T09:01:00'),
        createdAt: new Date('2025-09-05T08:45:00')
      },
      {
        userId: client3.id,
        amount: 180.00,
        currency: 'EUR',
        status: 'COMPLETED' as const,
        description: 'Manutenzione caldaia annuale',
        processedAt: subDays(new Date(), 1),
        createdAt: subDays(subHours(new Date(), 0.5), 1)
      },
      {
        userId: client2.id,
        amount: 90.00,
        currency: 'EUR',
        status: 'COMPLETED' as const,
        description: 'Piccola riparazione idraulica',
        processedAt: new Date('2025-09-12T17:35:00'),
        createdAt: new Date('2025-09-12T17:00:00')
      },
      {
        userId: client1.id,
        amount: 500.00,
        currency: 'EUR',
        status: 'COMPLETED' as const,
        description: 'Acconto installazione pannelli solari',
        processedAt: new Date('2025-09-23T09:00:00'),
        createdAt: new Date('2025-09-21T15:00:00')
      },
      {
        userId: client2.id,
        amount: 320.00,
        currency: 'EUR',
        status: 'PROCESSING' as const,
        description: 'Sostituzione boiler - bonifico in elaborazione',
        createdAt: subHours(new Date(), 12)
      }
    ];

    // Crea i pagamenti uno per uno
    let created = 0;
    for (const paymentData of paymentsData) {
      try {
        const payment = await prisma.payment.create({
          data: paymentData
        });
        created++;
        console.log(`✅ Creato pagamento ${created}: €${payment.amount} - ${payment.status}`);
      } catch (error) {
        console.log(`⚠️ Errore creazione pagamento:`, error.message);
        // Continua con il prossimo
      }
    }

    console.log(`\n✅ Creati ${created} pagamenti di test su ${paymentsData.length} tentati!`);

    // Mostra statistiche
    const stats = await prisma.payment.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        amount: true
      }
    });

    console.log('\n📊 Statistiche pagamenti nel database:');
    console.log('=====================================');
    stats.forEach(stat => {
      console.log(`${stat.status}: ${stat._count} pagamenti, totale €${stat._sum.amount || 0}`);
    });

    const totalPayments = await prisma.payment.count();
    const totalAmount = await prisma.payment.aggregate({
      _sum: { amount: true }
    });
    
    console.log('-------------------------------------');
    console.log(`TOTALE: ${totalPayments} pagamenti, €${totalAmount._sum.amount || 0}`);

  } catch (error) {
    console.error('❌ Errore generale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
createTestPayments()
  .then(() => console.log('\n✨ Script completato!'))
  .catch(console.error);
