#!/bin/bash

echo "Populating database with real data..."

cd backend

# Create populate script
cat > populate-dashboard.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Create admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assistenza.it' },
    update: {},
    create: {
      email: 'admin@assistenza.it',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN',
      phone: '0000000000',
      address: 'Via Admin 1',
      city: 'Roma',
      province: 'RM',
      postalCode: '00100',
      organizationId: 'default',
      isVerified: true
    }
  });

  // Create some clients
  for(let i = 1; i <= 5; i++) {
    await prisma.user.upsert({
      where: { email: `client${i}@test.it` },
      update: {},
      create: {
        email: `client${i}@test.it`,
        username: `client${i}`,
        password: hashedPassword,
        firstName: `Cliente`,
        lastName: `${i}`,
        fullName: `Cliente ${i}`,
        role: 'CLIENT',
        phone: `333000000${i}`,
        address: `Via Test ${i}`,
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        organizationId: 'default',
        isVerified: true
      }
    });
  }

  // Create professionals
  for(let i = 1; i <= 3; i++) {
    await prisma.user.upsert({
      where: { email: `prof${i}@test.it` },
      update: {},
      create: {
        email: `prof${i}@test.it`,
        username: `prof${i}`,
        password: hashedPassword,
        firstName: `Professionista`,
        lastName: `${i}`,
        fullName: `Professionista ${i}`,
        role: 'PROFESSIONAL',
        phone: `334000000${i}`,
        address: `Via Lavoro ${i}`,
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        organizationId: 'default',
        isVerified: true,
        profession: 'Tecnico'
      }
    });
  }

  // Get users for creating requests
  const clients = await prisma.user.findMany({ where: { role: 'CLIENT' }});
  const profs = await prisma.user.findMany({ where: { role: 'PROFESSIONAL' }});

  // Create requests with different statuses
  const statuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
  
  for(let i = 0; i < 20; i++) {
    const client = clients[Math.floor(Math.random() * clients.length)];
    const prof = profs[Math.floor(Math.random() * profs.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const request = await prisma.assistanceRequest.create({
      data: {
        clientId: client.id,
        professionalId: status !== 'pending' ? prof.id : null,
        title: `Richiesta assistenza ${i + 1}`,
        description: `Descrizione dettagliata del problema ${i + 1}`,
        category: ['Idraulica', 'Elettricista', 'Climatizzazione'][Math.floor(Math.random() * 3)],
        status: status,
        priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)],
        address: client.address,
        city: client.city,
        province: client.province,
        postalCode: client.postalCode,
        organizationId: 'default',
        requestedDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Create quotes for assigned/completed requests
    if (status !== 'pending' && Math.random() > 0.3) {
      await prisma.quote.create({
        data: {
          requestId: request.id,
          professionalId: prof.id,
          title: `Preventivo per ${request.title}`,
          description: 'Preventivo dettagliato',
          totalAmount: Math.floor(Math.random() * 100000) + 10000, // 100-1000 euro in cents
          currency: 'EUR',
          status: status === 'completed' ? 'accepted' : 'pending',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          version: 1,
          organizationId: 'default'
        }
      });
    }
  }

  console.log('Database populated successfully!');
  
  // Show stats
  const userCount = await prisma.user.count();
  const requestCount = await prisma.assistanceRequest.count();
  const quoteCount = await prisma.quote.count();
  
  console.log(`Stats: ${userCount} users, ${requestCount} requests, ${quoteCount} quotes`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
EOF

# Run populate script
node populate-dashboard.js

# Clean up
rm populate-dashboard.js

echo "Done! You can now login with admin@assistenza.it / password123"
