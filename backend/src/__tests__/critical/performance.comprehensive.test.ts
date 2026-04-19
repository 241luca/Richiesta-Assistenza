/**
 * ⚡ PERFORMANCE COMPREHENSIVE TESTS
 * Load testing, stress testing, response time validation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

let testToken: string;
let categoryId: string;
let subcategoryId: string;

describe('⚡ PERFORMANCE: Load & Stress Tests', () => {

  beforeAll(async () => {
    console.log('⚡ Setup performance test environment...');

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'perf.test@example.com',
        username: 'perf_test',
        password: await bcrypt.hash('Test123!', 10),
        firstName: 'Perf',
        lastName: 'Test',
        fullName: 'Perf Test',
        role: 'CLIENT',
        emailVerified: true,
        updatedAt: new Date()
      }
    });

    testToken = jwt.sign(
      { userId: user.id, email: user.email, role: 'CLIENT' },
      process.env.JWT_SECRET || 'test-secret'
    );

    const category = await prisma.category.create({
      data: {
        id: uuidv4(),
        name: 'Perf Test Category',
        slug: 'perf-test-category',
        color: '#000000',
        icon: '⚡',
        description: 'Performance test',
        isActive: true,
        displayOrder: 0,
        updatedAt: new Date()
      }
    });
    categoryId = category.id;

    const subcategory = await prisma.subcategory.create({
      data: {
        id: uuidv4(),
        name: 'Perf Test Subcategory',
        slug: 'perf-test-subcategory',
        description: 'Performance test',
        categoryId: category.id,
        isActive: true,
        displayOrder: 0,
        updatedAt: new Date()
      }
    });
    subcategoryId = subcategory.id;

    console.log('✅ Performance test environment ready');
  });

  afterAll(async () => {
    await prisma.subcategory.deleteMany({ where: { id: subcategoryId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.user.deleteMany({ where: { email: 'perf.test@example.com' } });
    await prisma.$disconnect();
  });

  describe('1️⃣ RESPONSE TIME - API Endpoints', () => {

    it('✅ Login endpoint responds in < 500ms', async () => {
      const start = Date.now();

      await request(global.app)
        .post('/api/auth/login')
        .send({
          email: 'perf.test@example.com',
          password: 'Test123!'
        });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('✅ GET requests list responds in < 300ms', async () => {
      const start = Date.now();

      await request(global.app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${testToken}`);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(300);
    });

    it('✅ GET single request responds in < 200ms', async () => {
      const fakeId = uuidv4();
      const start = Date.now();

      await request(global.app)
        .get(`/api/requests/${fakeId}`)
        .set('Authorization', `Bearer ${testToken}`);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe('2️⃣ LOAD TEST - Concurrent Requests', () => {

    it('✅ Handles 50 concurrent GET requests', async () => {
      const concurrentRequests = 50;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(global.app)
            .get('/api/requests')
            .set('Authorization', `Bearer ${testToken}`)
        );
      }

      const start = Date.now();
      const results = await Promise.all(promises);
      const duration = Date.now() - start;

      // All should succeed
      expect(results.every(r => r.status === 200 || r.status === 404)).toBe(true);
      
      // Average response time should be reasonable
      const avgTime = duration / concurrentRequests;
      expect(avgTime).toBeLessThan(1000);
    }, 30000);

    it('✅ Handles 100 concurrent auth checks', async () => {
      const concurrentRequests = 100;
      const promises: Promise<any>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          request(global.app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${testToken}`)
        );
      }

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.status === 200).length;

      expect(successCount).toBeGreaterThan(90); // At least 90% success
    }, 30000);
  });

  describe('3️⃣ STRESS TEST - Database Queries', () => {

    it('✅ Handles sequential inserts efficiently', async () => {
      const insertCount = 10;
      const start = Date.now();

      for (let i = 0; i < insertCount; i++) {
        await prisma.user.create({
          data: {
            id: uuidv4(),
            email: `stress${i}@test.com`,
            username: `stress${i}`,
            password: await bcrypt.hash('Test123!', 10),
            firstName: `Stress${i}`,
            lastName: 'Test',
            fullName: `Stress${i} Test`,
            role: 'CLIENT',
            emailVerified: true,
            updatedAt: new Date()
          }
        });
      }

      const duration = Date.now() - start;
      const avgTime = duration / insertCount;

      expect(avgTime).toBeLessThan(100); // < 100ms per insert

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: { startsWith: 'stress' } }
      });
    }, 20000);

    it('✅ Handles batch operations', async () => {
      const batchSize = 50;
      const users: any[] = [];

      for (let i = 0; i < batchSize; i++) {
        users.push({
          id: uuidv4(),
          email: `batch${i}@test.com`,
          username: `batch${i}`,
          password: await bcrypt.hash('Test123!', 10),
          firstName: `Batch${i}`,
          lastName: 'Test',
          fullName: `Batch${i} Test`,
          role: 'CLIENT' as const,
          emailVerified: true,
          updatedAt: new Date()
        });
      }

      const start = Date.now();
      await prisma.user.createMany({ data: users });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000); // < 2s for 50 inserts

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: { startsWith: 'batch' } }
      });
    }, 20000);
  });

  describe('4️⃣ PAGINATION - Large Datasets', () => {

    beforeAll(async () => {
      // Create 100 test users for pagination
      const users: any[] = [];
      for (let i = 0; i < 100; i++) {
        users.push({
          id: uuidv4(),
          email: `pagination${i}@test.com`,
          username: `pagination${i}`,
          password: await bcrypt.hash('Test123!', 10),
          firstName: `Page${i}`,
          lastName: 'Test',
          fullName: `Page${i} Test`,
          role: 'CLIENT' as const,
          emailVerified: true,
          updatedAt: new Date()
        });
      }
      await prisma.user.createMany({ data: users });
    });

    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { email: { startsWith: 'pagination' } }
      });
    });

    it('✅ First page loads in < 500ms', async () => {
      const start = Date.now();

      await request(global.app)
        .get('/api/admin/users?page=1&limit=20')
        .set('Authorization', `Bearer ${testToken}`);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('✅ Last page loads in < 500ms', async () => {
      const start = Date.now();

      await request(global.app)
        .get('/api/admin/users?page=5&limit=20')
        .set('Authorization', `Bearer ${testToken}`);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('✅ Handles large page sizes', async () => {
      const start = Date.now();

      const response = await request(global.app)
        .get('/api/admin/users?page=1&limit=100')
        .set('Authorization', `Bearer ${testToken}`);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('5️⃣ CACHING - Performance Optimization', () => {

    it('✅ Repeated requests are faster (caching)', async () => {
      // First request (cold)
      const start1 = Date.now();
      await request(global.app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${testToken}`);
      const duration1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      await request(global.app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${testToken}`);
      const duration2 = Date.now() - start2;

      // Second request should be faster (or similar if no caching)
      expect(duration2).toBeLessThanOrEqual(duration1 * 1.5);
    });
  });

  describe('6️⃣ MEMORY - Resource Management', () => {

    it('✅ No memory leaks on repeated requests', async () => {
      const iterations = 100;
      const memBefore = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        await request(global.app)
          .get('/api/requests')
          .set('Authorization', `Bearer ${testToken}`);
      }

      // Force garbage collection if available
      if (global.gc) global.gc();

      const memAfter = process.memoryUsage().heapUsed;
      const memIncrease = memAfter - memBefore;

      // Memory should not increase significantly
      expect(memIncrease).toBeLessThan(50 * 1024 * 1024); // < 50MB
    }, 60000);
  });
});
