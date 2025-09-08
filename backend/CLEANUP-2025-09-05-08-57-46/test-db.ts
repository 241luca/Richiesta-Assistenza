import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    const users = await prisma.user.count();
    const categories = await prisma.category.count();
    const requests = await prisma.assistanceRequest.count();
    
    console.log('=== TEST DATABASE POST-MIGRAZIONE ===');
    console.log('✅ Users:', users);
    console.log('✅ Categories:', categories);
    console.log('✅ AssistanceRequests:', requests);
    console.log('====================================');
    console.log('✨ Database funzionante senza organizationId!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

test();
