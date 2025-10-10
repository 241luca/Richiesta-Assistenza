/**
 * Professional Test Suite - Authentication System
 * Complete test coverage with smart error handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { app } from '../server';

// Initialize test database connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/richiesta_assistenza_test'
    }
  }
});

// Test data
const testUsers = {
  client: {
    email: 'test.client@example.com',
    username: 'testclient',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Client',
    fullName: 'Test Client',
    phone: '1234567890',
    address: 'Via Test 123',
    city: 'Milano',
    province: 'MI',
    postalCode: '20100',
    role: 'CLIENT'
  },
  professional: {
    email: 'test.professional@example.com',
    username: 'testprofessional',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Professional',
    fullName: 'Test Professional',
    phone: '0987654321',
    address: 'Via Pro 456',
    city: 'Roma',
    province: 'RM',
    postalCode: '00100',
    role: 'PROFESSIONAL'
  },
  admin: {
    email: 'test.admin@example.com',
    username: 'testadmin',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Admin',
    fullName: 'Test Admin',
    phone: '5555555555',
    address: 'Via Admin 789',
    city: 'Napoli',
    province: 'NA',
    postalCode: '80100',
    role: 'ADMIN'
  }
};

describe('🔐 Authentication System Tests', () => {
  
  // Clean database before all tests
  beforeAll(async () => {
    console.log('🧹 Preparing test database...');
    
    // Clean up existing test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: Object.values(testUsers).map(u => u.email)
        }
      }
    });
    
    console.log('✅ Test database ready');
  });

  // Clean up after all tests
  afterAll(async () => {
    console.log('🧹 Cleaning up test data...');
    
    await prisma.user.deleteMany({
      where: {
        email: {
          in: Object.values(testUsers).map(u => u.email)
        }
      }
    });
    
    await prisma.$disconnect();
    console.log('✅ Cleanup complete');
  });

  describe('📝 User Registration', () => {
    
    it('✅ Should register a new client successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUsers.client)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUsers.client.email);
      expect(response.body.user.role).toBe('CLIENT');
      
      // Verify password is not returned
      expect(response.body.user.password).toBeUndefined();
    });

    it('✅ Should register a professional successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUsers.professional)
        .expect(201);

      expect(response.body.user.email).toBe(testUsers.professional.email);
      expect(response.body.user.role).toBe('PROFESSIONAL');
    });

    it('❌ Should not register duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUsers.client)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    it('❌ Should validate required fields', async () => {
      const invalidUser = { email: 'invalid@test.com' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('❌ Should validate email format', async () => {
      const invalidEmail = { ...testUsers.admin, email: 'notanemail' };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmail)
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    it('❌ Should validate password strength', async () => {
      const weakPassword = { 
        ...testUsers.admin, 
        email: 'weak@test.com',
        username: 'weakuser',
        password: '123' 
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPassword)
        .expect(400);

      expect(response.body.error).toContain('password');
    });
  });

  describe('🔑 User Login', () => {
    
    it('✅ Should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.client.email,
          password: testUsers.client.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testUsers.client.email);
      
      // Verify JWT token
      const decoded = jwt.decode(response.body.accessToken) as any;
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email');
    });

    it('❌ Should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.client.email,
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid');
    });

    it('❌ Should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('❌ Should handle missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('🔄 Token Refresh', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.client.email,
          password: testUsers.client.password
        });
      
      accessToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
    });

    it('✅ Should refresh token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      
      // New tokens should be different
      expect(response.body.accessToken).not.toBe(accessToken);
    });

    it('❌ Should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('❌ Should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('🚪 User Logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.client.email,
          password: testUsers.client.password
        });
      
      accessToken = loginResponse.body.accessToken;
    });

    it('✅ Should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('success');
    });

    it('✅ Should handle logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('🛡️ Protected Routes', () => {
    let clientToken: string;
    let professionalToken: string;
    let adminToken: string;

    beforeAll(async () => {
      // Register admin if not exists
      await request(app)
        .post('/api/auth/register')
        .send(testUsers.admin);

      // Login all users
      const clientLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.client.email,
          password: testUsers.client.password
        });
      clientToken = clientLogin.body.accessToken;

      const professionalLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.professional.email,
          password: testUsers.professional.password
        });
      professionalToken = professionalLogin.body.accessToken;

      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.admin.email,
          password: testUsers.admin.password
        });
      adminToken = adminLogin.body.accessToken;
    });

    it('✅ Should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe(testUsers.client.email);
    });

    it('❌ Should reject access without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('❌ Should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('✅ Should enforce role-based access', async () => {
      // Admin should access admin routes
      const adminResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Client should not access admin routes
      const clientResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      expect(clientResponse.body).toHaveProperty('error');
    });
  });

  describe('🔐 Password Reset', () => {
    
    it('✅ Should request password reset', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: testUsers.client.email
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('email sent');
    });

    it('✅ Should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@example.com'
        })
        .expect(200);

      // Security: Don't reveal if email exists
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('email sent');
    });
  });
});
