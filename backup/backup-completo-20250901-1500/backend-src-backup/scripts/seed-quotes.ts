import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedQuotes() {
  try {
    console.log('🌱 Starting to seed quotes...');

    // Prima verifichiamo che ci siano utenti e richieste
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    const professional = await prisma.user.findFirst({
      where: { role: 'PROFESSIONAL' }
    });

    const client = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });

    if (!superAdmin || !professional || !client) {
      console.log('❌ Users not found. Please run user seeder first.');
      return;
    }

    console.log('✅ Found users:', { 
      superAdmin: superAdmin.email,
      professional: professional.email,
      client: client.email 
    });

    // Creiamo una categoria se non esiste
    let category = await prisma.category.findFirst();
    
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Elettricista',
          slug: 'elettricista',
          description: 'Servizi elettrici',
          color: '#FFD700',
          textColor: '#000000'
        }
      });
      console.log('✅ Created category:', category.name);
    } else {
      console.log('✅ Found category:', category.name);
    }

    // Creiamo una richiesta se non esiste
    let request = await prisma.assistanceRequest.findFirst({
      where: { clientId: client.id }
    });

    if (!request) {
      request = await prisma.assistanceRequest.create({
        data: {
          title: 'Riparazione impianto elettrico',
          description: 'Ho bisogno di riparare l\'impianto elettrico in casa',
          clientId: client.id,
          categoryId: category.id,
          status: 'ASSIGNED',
          priority: 'HIGH',
          professionalId: professional.id,
          address: 'Via Roma 1',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        }
      });
      console.log('✅ Created request:', request.title);
    } else {
      console.log('✅ Found request:', request.title);
    }

    // Verifichiamo se esistono già preventivi
    const existingQuotes = await prisma.quote.count({
      where: { requestId: request.id }
    });

    if (existingQuotes > 0) {
      console.log(`ℹ️ Found ${existingQuotes} existing quotes for this request`);
      return;
    }

    // Creiamo alcuni preventivi di esempio
    const quotes = [
      {
        title: 'Preventivo riparazione impianto base',
        description: 'Riparazione base dell\'impianto elettrico',
        amount: 500.00,
        status: 'PENDING' as const,
        items: [
          {
            description: 'Manodopera (2 ore)',
            quantity: 2,
            unitPrice: 50.00,
            totalPrice: 100.00
          },
          {
            description: 'Materiali elettrici',
            quantity: 1,
            unitPrice: 200.00,
            totalPrice: 200.00
          },
          {
            description: 'Certificazione impianto',
            quantity: 1,
            unitPrice: 200.00,
            totalPrice: 200.00
          }
        ]
      },
      {
        title: 'Preventivo riparazione completa',
        description: 'Riparazione completa con sostituzione componenti',
        amount: 800.00,
        status: 'PENDING' as const,
        items: [
          {
            description: 'Manodopera (4 ore)',
            quantity: 4,
            unitPrice: 50.00,
            totalPrice: 200.00
          },
          {
            description: 'Quadro elettrico nuovo',
            quantity: 1,
            unitPrice: 400.00,
            totalPrice: 400.00
          },
          {
            description: 'Cavi e componenti',
            quantity: 1,
            unitPrice: 200.00,
            totalPrice: 200.00
          }
        ]
      }
    ];

    for (const quoteData of quotes) {
      const { items, ...quoteInfo } = quoteData;
      
      const quote = await prisma.quote.create({
        data: {
          ...quoteInfo,
          requestId: request.id,
          professionalId: professional.id,
          currency: 'EUR',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
          terms: 'Pagamento alla fine dei lavori',
          items: {
            create: items.map((item, index) => ({
              ...item,
              order: index + 1,
              taxRate: 0.22,
              taxAmount: item.totalPrice * 0.22
            }))
          }
        },
        include: {
          items: true
        }
      });
      
      console.log(`✅ Created quote: ${quote.title} with ${quote.items.length} items`);
    }

    console.log('🎉 Quotes seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding quotes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il seeder
seedQuotes();
