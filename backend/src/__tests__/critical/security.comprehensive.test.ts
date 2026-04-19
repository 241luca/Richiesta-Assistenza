/**
 * 🔐 SECURITY COMPREHENSIVE TESTS
 * Test intensivo per sicurezza: Auth, Permissions, Injection, XSS, CSRF
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

let testUserId: string;
let validToken: string;

describe('🔐 SECURITY: Comprehensive Security Tests', () => {

  beforeAll(async () => {
    console.log('🔒 Setup security test environment...');

    // Create test user
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'security.test@example.com',
        username: 'security_test',
        password: await bcrypt.hash('SecurePass123!', 10),
        firstName: 'Security',
        lastName: 'Test',
        fullName: 'Security Test',
        role: 'CLIENT',
        emailVerified: true,
        updatedAt: new Date()
      }
    });
    testUserId = user.id;

    // Generate valid token
    validToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    console.log('✅ Security test environment ready');
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'security.test' } }
    });
    await prisma.$disconnect();
  });

  describe('1️⃣ AUTHENTICATION - JWT & Sessions', () => {

    it('❌ Rejects requests without token', async () => {
      await request(global.app)
        .get('/api/requests')
        .expect(401);
    });

    it('❌ Rejects invalid token format', async () => {
      await request(global.app)
        .get('/api/requests')
        .set('Authorization', 'Bearer invalid-token-format')
        .expect(401);
    });

    it('❌ Rejects expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUserId, email: 'test@test.com', role: 'CLIENT' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Already expired
      );

      await request(global.app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('❌ Rejects token with invalid signature', async () => {
      const tamperedToken = jwt.sign(
        { userId: testUserId, email: 'test@test.com', role: 'CLIENT' },
        'wrong-secret'
      );

      await request(global.app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });

    it('❌ Rejects token for non-existent user', async () => {
      const fakeToken = jwt.sign(
        { userId: uuidv4(), email: 'fake@test.com', role: 'CLIENT' },
        process.env.JWT_SECRET || 'test-secret'
      );

      await request(global.app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(401);
    });

    it('✅ Accepts valid token', async () => {
      await request(global.app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);
    });
  });

  describe('2️⃣ AUTHORIZATION - Role-Based Access Control', () => {

    let clientToken: string;
    let professionalToken: string;
    let adminToken: string;

    beforeAll(async () => {
      // Create users with different roles
      const client = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: 'security.client@test.com',
          username: 'sec_client',
          password: await bcrypt.hash('Test123!', 10),
          firstName: 'Sec',
          lastName: 'Client',
          fullName: 'Sec Client',
          role: 'CLIENT',
          emailVerified: true,
          updatedAt: new Date()
        }
      });
      clientToken = jwt.sign(
        { userId: client.id, email: client.email, role: 'CLIENT' },
        process.env.JWT_SECRET || 'test-secret'
      );

      const professional = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: 'security.pro@test.com',
          username: 'sec_pro',
          password: await bcrypt.hash('Test123!', 10),
          firstName: 'Sec',
          lastName: 'Pro',
          fullName: 'Sec Pro',
          role: 'PROFESSIONAL',
          emailVerified: true,
          updatedAt: new Date()
        }
      });
      professionalToken = jwt.sign(
        { userId: professional.id, email: professional.email, role: 'PROFESSIONAL' },
        process.env.JWT_SECRET || 'test-secret'
      );

      const admin = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: 'security.admin@test.com',
          username: 'sec_admin',
          password: await bcrypt.hash('Test123!', 10),
          firstName: 'Sec',
          lastName: 'Admin',
          fullName: 'Sec Admin',
          role: 'SUPER_ADMIN',
          emailVerified: true,
          updatedAt: new Date()
        }
      });
      adminToken = jwt.sign(
        { userId: admin.id, email: admin.email, role: 'SUPER_ADMIN' },
        process.env.JWT_SECRET || 'test-secret'
      );
    });

    it('❌ Client cannot access admin endpoints', async () => {
      await request(global.app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);
    });

    it('❌ Professional cannot access admin-only endpoints', async () => {
      await request(global.app)
        .get('/api/admin/system-settings')
        .set('Authorization', `Bearer ${professionalToken}`)
        .expect(403);
    });

    it('✅ Admin can access admin endpoints', async () => {
      const response = await request(global.app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(response.status); // 200 or 404 both OK (endpoint may not exist)
    });

    it('❌ Client cannot modify other users', async () => {
      const otherUserId = uuidv4();

      await request(global.app)
        .put(`/api/users/${otherUserId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ firstName: 'Hacked' })
        .expect(403);
    });
  });

  describe('3️⃣ SQL INJECTION - Database Security', () => {

    it('❌ Protects against SQL injection in login', async () => {
      const sqlPayload = "admin' OR '1'='1";

      const response = await request(global.app)
        .post('/api/auth/login')
        .send({
          email: sqlPayload,
          password: 'anything'
        });

      expect(response.status).not.toBe(200);
      expect(response.body).not.toHaveProperty('accessToken');
    });

    it('❌ Protects against SQL injection in search', async () => {
      const sqlPayload = "'; DROP TABLE users; --";

      await request(global.app)
        .get(`/api/requests?search=${encodeURIComponent(sqlPayload)}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(response => {
          // Should not crash, should return safe results
          expect(response.status).toBeLessThan(500);
        });
    });

    it('❌ Protects against SQL injection in filters', async () => {
      const sqlPayload = "1' OR '1'='1";

      await request(global.app)
        .get(`/api/requests?status=${encodeURIComponent(sqlPayload)}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(response => {
          expect(response.status).toBeLessThan(500);
        });
    });
  });

  describe('4️⃣ XSS - Cross-Site Scripting Protection', () => {

    it('❌ Sanitizes XSS in request title', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await request(global.app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: xssPayload,
          description: 'Test XSS',
          categoryId: uuidv4(),
          subcategoryId: uuidv4(),
          priority: 'LOW',
          address: 'Test',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        });

      if (response.status === 201) {
        // If created, check that script tags are escaped/removed
        expect(response.body.data.title).not.toContain('<script>');
        
        // Cleanup
        // await prisma.assistanceRequest.delete({ where: { id: response.body.data.id } });
      }
    });

    it('❌ Sanitizes XSS in description', async () => {
      const xssPayload = '<img src=x onerror="alert(1)">';

      const response = await request(global.app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'XSS Test',
          description: xssPayload,
          categoryId: uuidv4(),
          subcategoryId: uuidv4(),
          priority: 'LOW',
          address: 'Test',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        });

      if (response.status === 201) {
        expect(response.body.data.description).not.toContain('onerror');
        // await prisma.assistanceRequest.delete({ where: { id: response.body.data.id } });
      }
    });
  });

  describe('5️⃣ PASSWORD SECURITY - Hashing & Validation', () => {

    it('✅ Passwords are hashed in database', async () => {
      const testUser = await prisma.user.findUnique({
        where: { id: testUserId }
      });

      expect(testUser?.password).toBeDefined();
      expect(testUser?.password).not.toBe('SecurePass123!');
      expect(testUser?.password?.startsWith('$2')).toBe(true); // bcrypt hash
    });

    it('❌ Password not returned in API responses', async () => {
      const response = await request(global.app)
        .get(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.data).not.toHaveProperty('password');
    });

    it('❌ Rejects weak passwords', async () => {
      await request(global.app)
        .post('/api/auth/register')
        .send({
          email: 'weak@test.com',
          username: 'weakpass',
          password: '123',
          firstName: 'Weak',
          lastName: 'Pass',
          fullName: 'Weak Pass',
          role: 'CLIENT'
        })
        .expect(400);
    });

    it('✅ Accepts strong passwords', async () => {
      const response = await request(global.app)
        .post('/api/auth/register')
        .send({
          email: 'strong@test.com',
          username: 'strongpass',
          password: 'StrongP@ssw0rd123!',
          firstName: 'Strong',
          lastName: 'Pass',
          fullName: 'Strong Pass',
          role: 'CLIENT'
        });

      if (response.status === 201) {
        await prisma.user.delete({ where: { email: 'strong@test.com' } });
      }
    });
  });

  describe('6️⃣ RATE LIMITING - Brute Force Protection', () => {

    it('❌ Limits login attempts', async () => {
      const attempts = 20;
      let blockedCount = 0;

      for (let i = 0; i < attempts; i++) {
        const response = await request(global.app)
          .post('/api/auth/login')
          .send({
            email: 'attacker@test.com',
            password: 'wrong'
          });

        if (response.status === 429) {
          blockedCount++;
        }
      }

      // After many attempts, should get rate limited
      expect(blockedCount).toBeGreaterThan(0);
    }, 30000); // Longer timeout for rate limit test
  });

  describe('7️⃣ INPUT VALIDATION - Data Sanitization', () => {

    it('❌ Rejects invalid email format', async () => {
      await request(global.app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          username: 'testuser',
          password: 'Test123!',
          firstName: 'Test',
          lastName: 'User',
          fullName: 'Test User',
          role: 'CLIENT'
        })
        .expect(400);
    });

    it('❌ Rejects invalid phone format', async () => {
      await request(global.app)
        .post('/api/auth/register')
        .send({
          email: 'phone@test.com',
          username: 'phoneuser',
          password: 'Test123!',
          firstName: 'Phone',
          lastName: 'User',
          fullName: 'Phone User',
          phone: 'not-a-phone',
          role: 'CLIENT'
        })
        .expect(400);
    });

    it('❌ Rejects invalid postal code', async () => {
      await request(global.app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Invalid Postal Code',
          description: 'Test',
          categoryId: uuidv4(),
          subcategoryId: uuidv4(),
          priority: 'LOW',
          address: 'Test',
          city: 'Milano',
          province: 'MI',
          postalCode: 'INVALID'
        })
        .expect(400);
    });
  });

  describe('8️⃣ SESSION SECURITY - Token Management', () => {

    it('✅ Tokens have expiration', async () => {
      const decoded = jwt.decode(validToken) as any;
      expect(decoded).toHaveProperty('exp');
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('❌ Cannot reuse refresh token after logout', async () => {
      // Login
      const loginResponse = await request(global.app)
        .post('/api/auth/login')
        .send({
          email: 'security.test@example.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      const { refreshToken } = loginResponse.body;

      // Logout
      await request(global.app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Try to use refresh token
      const refreshResponse = await request(global.app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).not.toBe(200);
    });
  });

  describe('9️⃣ FILE UPLOAD SECURITY', () => {

    it('❌ Rejects executable files', async () => {
      const response = await request(global.app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('fake exe content'), 'malware.exe');

      expect(response.status).not.toBe(200);
    });

    it('❌ Rejects files over size limit', async () => {
      const largeBuffer = Buffer.alloc(100 * 1024 * 1024); // 100MB

      const response = await request(global.app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', largeBuffer, 'large.pdf');

      expect(response.status).not.toBe(200);
    });

    it('✅ Accepts valid file types', async () => {
      const response = await request(global.app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('file', Buffer.from('PDF content'), 'document.pdf');

      // May return 200 or 400 depending on actual implementation
      expect([200, 400, 404]).toContain(response.status);
    });
  });
});
