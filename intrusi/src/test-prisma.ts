// Test file per verificare Prisma
import { prisma } from './config/database';

console.log('Prisma object:', prisma);
console.log('Prisma type:', typeof prisma);
console.log('Prisma methods:', Object.keys(prisma || {}));

async function testPrisma() {
  try {
    console.log('Testing Prisma connection...');
    const count = await prisma.user.count();
    console.log(`✅ Prisma works! Found ${count} users`);
  } catch (error) {
    console.error('❌ Prisma error:', error);
  }
  process.exit(0);
}

testPrisma();
