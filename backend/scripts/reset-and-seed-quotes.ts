import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetAndSeedQuotes() {
  try {
    console.log('🧹 Pulizia dati esistenti...');
    
    // Pulisci in ordine inverso per rispettare le foreign keys
    await prisma.quoteItem.deleteMany({});
    await prisma.quote.deleteMany({});
    await prisma.depositRule.deleteMany({});
    await prisma.assistanceRequest.deleteMany({});
    
    console.log('✅ Dati puliti');
    
    console.log('\n🌱 Seeding quote test data...');

    // Get users
    const client = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });

    const professional = await prisma.user.findFirst({
      where: { role: 'PROFESSIONAL' }
    });

    if (!client || !professional) {
      console.error('❌ Client or Professional not found. Please run main seed first.');
      return;
    }

    console.log('👤 Client:', client.fullName);
    console.log('👷 Professional:', professional.fullName);

    // Get or create a category
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: 'Elettricista',
          description: 'Servizi elettrici',
          organization: { connect: { id: client.organizationId! } },
          color: '#3B82F6',
          textColor: '#FFFFFF',
          isActive: true,
          displayOrder: 1
        }
      });
      console.log('✅ Created category:', category.name);
    } else {
      console.log('📂 Using existing category:', category.name);
    }

    // Get or create a subcategory
    let subcategory = await prisma.subcategory.findFirst({
      where: { categoryId: category.id }
    });
    
    if (!subcategory) {
      subcategory = await prisma.subcategory.create({
        data: {
          name: 'Impianti elettrici',
          description: 'Installazione e riparazione impianti',
          category: { connect: { id: category.id } },
          organization: { connect: { id: client.organizationId! } },
          isActive: true,
          displayOrder: 1
        }
      });
      console.log('✅ Created subcategory:', subcategory.name);
    } else {
      console.log('📂 Using existing subcategory:', subcategory.name);
    }

    // Create test requests
    console.log('\n📋 Creating test requests...');
    const requests = await Promise.all([
      prisma.assistanceRequest.create({
        data: {
          title: 'Riparazione impianto elettrico',
          description: 'L\'interruttore generale continua a saltare',
          category: { connect: { id: category.id } },
          subcategory: { connect: { id: subcategory.id } },
          status: 'PENDING',
          priority: 'HIGH',
          client: { connect: { id: client.id } },
          organization: { connect: { id: client.organizationId! } },
          address: 'Via Roma 123',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100',
          requestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 giorni
        }
      }),
      prisma.assistanceRequest.create({
        data: {
          title: 'Installazione prese aggiuntive',
          description: 'Necessito di 3 prese aggiuntive in cucina',
          category: { connect: { id: category.id } },
          subcategory: { connect: { id: subcategory.id } },
          status: 'ASSIGNED',
          priority: 'MEDIUM',
          client: { connect: { id: client.id } },
          professional: { connect: { id: professional.id } },
          organization: { connect: { id: client.organizationId! } },
          address: 'Via Milano 45',
          city: 'Roma',
          province: 'RM',
          postalCode: '00100',
          requestedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          assignedDate: new Date()
        }
      }),
      prisma.assistanceRequest.create({
        data: {
          title: 'Sostituzione quadro elettrico',
          description: 'Il quadro elettrico è vecchio e necessita sostituzione',
          category: { connect: { id: category.id } },
          subcategory: { connect: { id: subcategory.id } },
          status: 'ASSIGNED',
          priority: 'HIGH',
          client: { connect: { id: client.id } },
          professional: { connect: { id: professional.id } },
          organization: { connect: { id: client.organizationId! } },
          address: 'Corso Italia 78',
          city: 'Torino',
          province: 'TO',
          postalCode: '10100',
          requestedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          assignedDate: new Date()
        }
      })
    ]);

    console.log(`✅ Created ${requests.length} test requests`);
    requests.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.title} (${r.status})`);
    });

    // Create sample quotes for the assigned requests
    console.log('\n💰 Creating test quotes...');
    
    // Quote 1 for second request
    const quote1 = await prisma.quote.create({
      data: {
        request: { connect: { id: requests[1].id } },
        professional: { connect: { id: professional.id } },
        organization: { connect: { id: professional.organizationId! } },
        title: 'Preventivo installazione prese cucina',
        description: 'Installazione di 3 prese aggiuntive con canalina',
        status: 'PENDING',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
        subtotal: 25000, // €250.00
        taxAmount: 5500, // €55.00
        discountAmount: 0,
        totalAmount: 30500, // €305.00
        currency: 'EUR',
        notes: 'Lavoro garantito 2 anni',
        termsConditions: 'Pagamento 50% all\'accettazione, 50% a fine lavori',
        version: 1
      }
    });

    // Create quote items for quote 1
    const quote1Items = await Promise.all([
      prisma.quoteItem.create({
        data: {
          quote: { connect: { id: quote1.id } },
          description: 'Presa elettrica Schuko 16A',
          quantity: 3,
          unitPrice: 2500, // €25.00
          taxRate: 0.22,
          totalPrice: 7500, // €75.00
          itemType: 'PRODUCT',
          unit: 'pz',
          displayOrder: 1
        }
      }),
      prisma.quoteItem.create({
        data: {
          quote: { connect: { id: quote1.id } },
          description: 'Canalina PVC 40x20mm (3 metri)',
          quantity: 3,
          unitPrice: 1500, // €15.00
          taxRate: 0.22,
          totalPrice: 4500, // €45.00
          itemType: 'PRODUCT',
          unit: 'm',
          displayOrder: 2
        }
      }),
      prisma.quoteItem.create({
        data: {
          quote: { connect: { id: quote1.id } },
          description: 'Manodopera installazione',
          quantity: 3,
          unitPrice: 4000, // €40.00
          taxRate: 0.22,
          totalPrice: 12000, // €120.00
          itemType: 'SERVICE',
          unit: 'ore',
          displayOrder: 3
        }
      })
    ]);

    console.log(`✅ Created quote "${quote1.title}" with ${quote1Items.length} items`);

    // Quote 2 for third request
    const quote2 = await prisma.quote.create({
      data: {
        request: { connect: { id: requests[2].id } },
        professional: { connect: { id: professional.id } },
        organization: { connect: { id: professional.organizationId! } },
        title: 'Preventivo sostituzione quadro elettrico',
        description: 'Sostituzione completa quadro elettrico con nuovo modello a norma',
        status: 'DRAFT',
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 giorni
        subtotal: 80000, // €800.00
        taxAmount: 17600, // €176.00
        discountAmount: 5000, // €50.00 sconto
        totalAmount: 92600, // €926.00
        currency: 'EUR',
        notes: 'Incluso smaltimento vecchio quadro',
        termsConditions: 'Pagamento 30% all\'ordine, 70% a fine lavori',
        version: 1
      }
    });

    // Create quote items for quote 2
    const quote2Items = await Promise.all([
      prisma.quoteItem.create({
        data: {
          quote: { connect: { id: quote2.id } },
          description: 'Quadro elettrico ABB 24 moduli',
          quantity: 1,
          unitPrice: 45000, // €450.00
          taxRate: 0.22,
          totalPrice: 45000,
          itemType: 'PRODUCT',
          unit: 'pz',
          displayOrder: 1
        }
      }),
      prisma.quoteItem.create({
        data: {
          quote: { connect: { id: quote2.id } },
          description: 'Interruttori magnetotermici e differenziali',
          quantity: 8,
          unitPrice: 3500, // €35.00 each
          taxRate: 0.22,
          totalPrice: 28000, // €280.00
          itemType: 'PRODUCT',
          unit: 'pz',
          displayOrder: 2
        }
      }),
      prisma.quoteItem.create({
        data: {
          quote: { connect: { id: quote2.id } },
          description: 'Manodopera installazione e collaudo',
          quantity: 6,
          unitPrice: 4500, // €45.00/ora
          taxRate: 0.22,
          totalPrice: 27000, // €270.00
          itemType: 'SERVICE',
          unit: 'ore',
          displayOrder: 3
        }
      }),
      prisma.quoteItem.create({
        data: {
          quote: { connect: { id: quote2.id } },
          description: 'Certificazione impianto e collaudo',
          quantity: 1,
          unitPrice: 15000, // €150.00
          taxRate: 0.22,
          totalPrice: 15000,
          itemType: 'SERVICE',
          unit: 'pz',
          displayOrder: 4
        }
      })
    ]);

    console.log(`✅ Created quote "${quote2.title}" with ${quote2Items.length} items`);

    // Create a deposit rule for the category
    const depositRule = await prisma.depositRule.create({
      data: {
        name: 'Deposito lavori elettrici',
        description: 'Deposito standard per lavori elettrici',
        category: { connect: { id: category.id } },
        depositType: 'PERCENTAGE',
        percentageAmount: 0.3, // 30%
        isActive: true
      }
    });

    console.log('✅ Created deposit rule:', depositRule.name);

    // Show summary
    const totalRequests = await prisma.assistanceRequest.count();
    const totalQuotes = await prisma.quote.count();
    const totalQuoteItems = await prisma.quoteItem.count();
    
    console.log('\n📊 DATABASE SUMMARY:');
    console.log(`- Total Requests: ${totalRequests}`);
    console.log(`- Total Quotes: ${totalQuotes}`);
    console.log(`- Total Quote Items: ${totalQuoteItems}`);
    console.log(`- Requests without quotes: 1 (first request is pending)`);
    
    console.log('\n✅ Quote test data seeded successfully!');
    console.log('\n🎯 You can now:');
    console.log('  1. View the quotes in the Quotes page');
    console.log('  2. Create new quotes for the pending request');
    console.log('  3. Accept/reject quotes as a client');
    console.log('  4. Compare multiple quotes for the same request');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAndSeedQuotes();
