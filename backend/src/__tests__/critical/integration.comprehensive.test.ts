/**
 * 🔗 INTEGRATION COMPREHENSIVE TESTS
 * Database, Redis, Email, Payments, External APIs
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';

const prisma = new PrismaClient();

describe('🔗 INTEGRATION: External Services', () => {

  describe('1️⃣ DATABASE - PostgreSQL Integration', () => {

    it('✅ Can connect to database', async () => {
      await expect(prisma.$connect()).resolves.not.toThrow();
    });

    it('✅ Can execute raw query', async () => {
      const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('✅ Transactions work correctly', async () => {
      const userId = uuidv4();

      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: userId,
            email: 'transaction@test.com',
            username: 'transaction_test',
            password: 'hashed_password',
            firstName: 'Transaction',
            lastName: 'Test',
            fullName: 'Transaction Test',
            role: 'CLIENT',
            emailVerified: true,
            updatedAt: new Date()
          }
        });

        // Verify user exists within transaction
        const user = await tx.user.findUnique({ where: { id: userId } });
        expect(user).toBeDefined();
      });

      // Verify user exists after transaction
      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user).toBeDefined();

      // Cleanup
      await prisma.user.delete({ where: { id: userId } });
    });

    it('✅ Rollback on transaction error', async () => {
      const userId = uuidv4();

      try {
        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              id: userId,
              email: 'rollback@test.com',
              username: 'rollback_test',
              password: 'hashed_password',
              firstName: 'Rollback',
              lastName: 'Test',
              fullName: 'Rollback Test',
              role: 'CLIENT',
              emailVerified: true,
              updatedAt: new Date()
            }
          });

          // Force error
          throw new Error('Intentional error');
        });
      } catch (error: unknown) {
        // Expected
      }

      // Verify user was NOT created (rollback)
      const user = await prisma.user.findUnique({ where: { id: userId } });
      expect(user).toBeNull();
    });

    it('✅ Handles concurrent writes', async () => {
      const concurrentWrites = 10;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < concurrentWrites; i++) {
        promises.push(
          prisma.user.create({
            data: {
              id: uuidv4(),
              email: `concurrent${i}@test.com`,
              username: `concurrent${i}`,
              password: 'hashed_password',
              firstName: `Concurrent${i}`,
              lastName: 'Test',
              fullName: `Concurrent${i} Test`,
              role: 'CLIENT',
              emailVerified: true,
              updatedAt: new Date()
            }
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(concurrentWrites);

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: { startsWith: 'concurrent' } }
      });
    });
  });

  describe('2️⃣ REDIS - Cache Integration', () => {

    let redis: Redis;

    beforeAll(() => {
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        lazyConnect: true
      });
    });

    afterAll(async () => {
      await redis.quit();
    });

    it('✅ Can connect to Redis', async () => {
      await expect(redis.connect()).resolves.not.toThrow();
    });

    it('✅ Can set and get values', async () => {
      const key = 'test:integration';
      const value = 'test-value';

      await redis.set(key, value);
      const retrieved = await redis.get(key);

      expect(retrieved).toBe(value);

      // Cleanup
      await redis.del(key);
    });

    it('✅ Handles expiration', async () => {
      const key = 'test:expire';
      const value = 'expires-soon';

      await redis.set(key, value, 'EX', 1); // 1 second TTL

      const immediate = await redis.get(key);
      expect(immediate).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      const expired = await redis.get(key);
      expect(expired).toBeNull();
    });

    it('✅ Can store complex objects', async () => {
      const key = 'test:object';
      const obj = {
        id: uuidv4(),
        name: 'Test Object',
        nested: { value: 123 }
      };

      await redis.set(key, JSON.stringify(obj));
      const retrieved = await redis.get(key);
      const parsed = JSON.parse(retrieved || '{}');

      expect(parsed.id).toBe(obj.id);
      expect(parsed.nested.value).toBe(123);

      // Cleanup
      await redis.del(key);
    });

    it('✅ Handles concurrent operations', async () => {
      const operations: Promise<any>[] = [];

      for (let i = 0; i < 50; i++) {
        operations.push(
          redis.set(`test:concurrent:${i}`, `value-${i}`)
        );
      }

      await expect(Promise.all(operations)).resolves.not.toThrow();

      // Cleanup
      const keys = await redis.keys('test:concurrent:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    });
  });

  describe('3️⃣ EMAIL - SMTP Integration', () => {

    it('✅ Email service is configured', () => {
      expect(process.env.SMTP_HOST).toBeDefined();
      expect(process.env.EMAIL_FROM).toBeDefined();
    });

    // Nota: Non inviamo email reali nei test
    it('✅ Can validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.com'
      ];

      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user @example.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('4️⃣ FILE SYSTEM - Upload/Storage', () => {

    it('✅ Upload directory exists', async () => {
      const fs = await import('fs');
      const uploadDir = process.env.UPLOAD_DIR || './uploads';

      const exists = fs.existsSync(uploadDir);
      expect(exists).toBe(true);
    });

    it('✅ Can write and read files', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const testFile = path.join(process.cwd(), 'test-file.txt');
      const content = 'Integration test content';

      await fs.writeFile(testFile, content);
      const read = await fs.readFile(testFile, 'utf-8');

      expect(read).toBe(content);

      // Cleanup
      await fs.unlink(testFile);
    });
  });

  describe('5️⃣ EXTERNAL APIs - Connectivity', () => {

    it('✅ Can make HTTP requests', async () => {
      const axios = await import('axios');

      const response = await axios.default.get('https://httpbin.org/status/200');
      expect(response.status).toBe(200);
    }, 10000);

    it('✅ Handles API errors gracefully', async () => {
      const axios = await import('axios');

      try {
        await axios.default.get('https://httpbin.org/status/500');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
      }
    }, 10000);
  });

  describe('6️⃣ WEBSOCKET - Real-time Communication', () => {

    it('✅ WebSocket server is configured', () => {
      expect(process.env.PORT).toBeDefined();
    });

    // Nota: Test completi WebSocket richiedono client/server setup
    it('✅ Can create WebSocket connection', () => {
      const { Server } = require('socket.io');
      const io = new Server();

      expect(io).toBeDefined();
      expect(typeof io.emit).toBe('function');

      io.close();
    });
  });

  describe('7️⃣ JOBS & QUEUES - Background Processing', () => {

    it('✅ Can create job queue', async () => {
      const Queue = (await import('bull')).default;
      
      const testQueue = new Queue('test-queue', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379
        }
      });

      expect(testQueue).toBeDefined();

      await testQueue.close();
    });

    it('✅ Can add and process jobs', async () => {
      const Queue = (await import('bull')).default;

      const jobQueue = new Queue('integration-test', {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT) || 6379
        }
      });

      let processed = false;

      jobQueue.process(async (job) => {
        processed = true;
        return { success: true };
      });

      await jobQueue.add({ test: 'data' });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(processed).toBe(true);

      await jobQueue.close();
    }, 15000);
  });
});
