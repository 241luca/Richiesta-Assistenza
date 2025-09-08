import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Create a single instance of PrismaClient
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] 
      : ['error'],
  });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Log database connection only once
prisma.$connect()
  .then(() => {
    logger.info('✅ Database connected successfully');
  })
  .catch((error) => {
    logger.error('❌ Database connection failed:', error);
    // Don't exit, SQLite doesn't need a connection
  });

// Graceful shutdown - register only once
if (!globalThis.prisma) {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  });
}

export { prisma };
export default prisma;
