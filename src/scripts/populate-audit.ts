import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function populate() {
  console.log('Aggiungo 50 record di audit log...');
  
  const actions = ['LOGIN_SUCCESS', 'CREATE', 'UPDATE', 'DELETE', 'REQUEST_CREATED', 'QUOTE_SENT'];
  const categories = ['SECURITY', 'BUSINESS', 'SYSTEM', 'API'];
  const severities = ['INFO', 'WARNING', 'ERROR'];
  
  for (let i = 0; i < 50; i++) {
    await prisma.auditLog.create({
      data: {
        action: actions[Math.floor(Math.random() * actions.length)] as any,
        entityType: ['User', 'Request', 'Quote', 'Payment'][Math.floor(Math.random() * 4)],
        entityId: `entity_${i}`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0',
        success: Math.random() > 0.2,
        severity: severities[Math.floor(Math.random() * severities.length)] as any,
        category: categories[Math.floor(Math.random() * categories.length)] as any,
        userEmail: `user${i}@example.com`,
        userRole: ['CLIENT', 'PROFESSIONAL', 'ADMIN'][Math.floor(Math.random() * 3)],
        statusCode: Math.random() > 0.8 ? 500 : 200,
        responseTime: Math.floor(Math.random() * 1000),
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // ultimi 7 giorni
      }
    });
  }
  
  console.log('✅ Fatto! 50 record aggiunti.');
  await prisma.$disconnect();
}

populate();
