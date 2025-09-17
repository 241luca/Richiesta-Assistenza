import { prisma } from '../../config/database';

console.log('Testing Prisma import...');
console.log('Prisma object:', prisma);
console.log('Prisma type:', typeof prisma);
console.log('Has scriptConfiguration?', prisma?.scriptConfiguration ? 'Yes' : 'No');

// Try to list methods
if (prisma) {
  console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')));
}

process.exit(0);
