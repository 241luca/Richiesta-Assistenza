import { prisma } from '../../config/database';

async function testPrisma() {
  console.log('=== PRISMA TEST ===');
  console.log('Prisma exists?', !!prisma);
  
  // List all available models
  const models = Object.keys(prisma).filter(key => {
    return !key.startsWith('_') && 
           !key.startsWith('$') && 
           key !== 'constructor' &&
           typeof (prisma as any)[key] === 'object';
  });
  
  console.log('Available models:', models);
  
  // Check specifically for scriptConfiguration
  console.log('Has scriptConfiguration?', !!(prisma as any).scriptConfiguration);
  
  // Try to access user model (should exist)
  console.log('Has user?', !!(prisma as any).user);
  
  // Check if we need to regenerate
  if (models.length === 0) {
    console.log('\n⚠️  NO MODELS FOUND! Need to regenerate Prisma Client');
    console.log('Run: npx prisma generate');
  }
  
  process.exit(0);
}

testPrisma();
