import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkApiKeys() {
  console.log('🔍 Controllo API Keys nel database...\n');
  
  const keys = await prisma.apiKey.findMany({
    select: {
      id: true,
      service: true,
      name: true,
      isActive: true,
      key: true
    },
    orderBy: { service: 'asc' }
  });

  console.log(`📋 Trovate ${keys.length} API Keys:\n`);
  
  keys.forEach(key => {
    const status = key.isActive ? '🟢' : '🔴';
    const hasKey = key.key && key.key.length > 10 ? '✅ OK' : '❌ MANCANTE';
    console.log(`${status} ${key.service.padEnd(30)} ${hasKey}`);
    console.log(`   ID: ${key.id}`);
    console.log(`   Nome: ${key.name}`);
    if (key.key) {
      console.log(`   Key: ${key.key.substring(0, 15)}...`);
    }
    console.log('');
  });

  await prisma.$disconnect();
}

checkApiKeys();
