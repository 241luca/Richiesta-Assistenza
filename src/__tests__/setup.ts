// Test setup file
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Create test database connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/richiesta_assistenza_test'
    }
  }
});

// Clean database before all tests
beforeAll(async () => {
  console.log('🧹 Cleaning test database...');
  
  // Delete in correct order due to foreign key constraints
  await prisma.assistanceRequest.deleteMany({});
  await prisma.quote.deleteMany({});
  await prisma.subcategory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.loginHistory.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('✅ Database cleaned');
});

// Clean after each test suite
afterEach(async () => {
  // Optional: clean specific tables after each test
});

// Clean everything after all tests
afterAll(async () => {
  console.log('🧹 Final cleanup...');
  
  // Clean all data
  await prisma.assistanceRequest.deleteMany({});
  await prisma.quote.deleteMany({});
  await prisma.subcategory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.loginHistory.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});
  
  // Disconnect from database
  await prisma.$disconnect();
  
  console.log('✅ Test cleanup complete');
});
