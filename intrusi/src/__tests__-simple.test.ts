/**
 * Simple test to verify test setup is working
 */

import { describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/richiesta_assistenza_test'
    }
  }
});

describe('Test Setup Verification', () => {
  it('should connect to test database', async () => {
    // Try to connect to database
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  it('should have correct environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should have JWT secret configured', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_REFRESH_SECRET).toBeDefined();
  });

  it('should perform basic math', () => {
    expect(1 + 1).toBe(2);
  });
});
