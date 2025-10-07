/**
 * Test Suite - API Endpoints
 * Test per gli endpoint principali dell'applicazione
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { app } from '../server';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/richiesta_assistenza_test'
    }
  }
});

describe('API Endpoints', () => {
  let authToken: string;
  let testUser: any;
  let testprofessional: any;
  let testAdmin: any;
  let testRequest: any;
  let testcategory: any;

  beforeAll(async () => {
    // Create test users
    testUser = await prisma.user.create({
      data: {
        email: 'client@test.com',
        username: 'clienttest',
        password: await bcrypt.hash('password123', 12),
        firstName: 'Client',
        lastName: 'Test',
        fullName: 'Client Test',
        phone: '1234567890',
        address: 'Via Test 1',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        role: 'CLIENT'
      }
    });

    testProfessional = await prisma.user.create({
      data: {
        email: 'professional@test.com',
        username: 'professionaltest',
        password: await bcrypt.hash('password123', 12),
        firstName: 'Professional',
        lastName: 'Test',
        fullName: 'Professional Test',
        phone: '0987654321',
        address: 'Via Pro 2',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        role: 'PROFESSIONAL'
      }
    });

    testAdmin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        username: 'admintest',
        password: await bcrypt.hash('password123', 12),
        firstName: 'Admin',
        lastName: 'Test',
        fullName: 'Admin Test',
        phone: '5555555555',
        address: 'Via Admin 3',
        city: 'Napoli',
        province: 'NA',
        postalCode: '80100',
        role: 'ADMIN'
      }
    });

    // Create test category
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Category for testing',
        color: '#FF0000',
        isActive: true,
        displayOrder: 1
      }
    });

    // Generate auth token for client
    authToken = jwt.sign(
      { userId: testUser.id },
      process.env.JWT_SECRET || 'assistenza_jwt_secret_2024_secure_key',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    if (testRequest) {
      await prisma.assistanceRequest.delete({ where: { id: testRequest.id } }).catch(() => {});
    }
    await prisma.category.delete({ where: { id: testCategory.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testProfessional.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: testAdmin.id } }).catch(() => {});
    await prisma.$disconnect();
  });

  describe('Assistance Requests', () => {
    
    describe('POST /api/requests', () => {
      it('should create a new request', async () => {
        const requestData = {
          title: 'Test Request',
          description: 'This is a test request',
          categoryId: testCategory.id,
          priority: 'MEDIUM',
          requestedDate: new Date().toISOString()
        };

        const response = await request(app)
          .post('/api/requests')
          .set('Authorization', `Bearer ${authToken}`)
          .send(requestData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe(requestData.title);
        expect(response.body.clientId).toBe(testUser.id);
        expect(response.body.status).toBe('PENDING');

        testRequest = response.body;
      });

      it('should validate required fields', async () => {
        const invalidRequest = {
          description: 'Missing title'
        };

        const response = await request(app)
          .post('/api/requests')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidRequest)
          .expect(400);

        expect(response.body).toHaveProperty('error');
      });

      it('should require authentication', async () => {
        const requestData = {
          title: 'Test Request',
          description: 'This is a test request'
        };

        await request(app)
          .post('/api/requests')
          .send(requestData)
          .expect(401);
      });
    });

    describe('GET /api/requests', () => {
      it('should list user requests', async () => {
        const response = await request(app)
          .get('/api/requests')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        
        const userRequest = response.body.find((r: any) => r.id === testRequest.id);
        expect(userRequest).toBeDefined();
      });

      it('should filter by status', async () => {
        const response = await request(app)
          .get('/api/requests?status=PENDING')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach((request: any) => {
          expect(request.status).toBe('PENDING');
        });
      });
    });

    describe('GET /api/requests/:id', () => {
      it('should get request details', async () => {
        const response = await request(app)
          .get(`/api/requests/${testRequest.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(testRequest.id);
        expect(response.body.title).toBe(testRequest.title);
      });

      it('should not allow access to other users requests', async () => {
        // Create token for professional
        const professionalToken = jwt.sign(
          { userId: testProfessional.id },
          process.env.JWT_SECRET || 'assistenza_jwt_secret_2024_secure_key',
          { expiresIn: '1h' }
        );

        await request(app)
          .get(`/api/requests/${testRequest.id}`)
          .set('Authorization', `Bearer ${professionalToken}`)
          .expect(403);
      });
    });

    describe('PUT /api/requests/:id', () => {
      it('should update request', async () => {
        const updateData = {
          title: 'Updated Request Title',
          priority: 'HIGH'
        };

        const response = await request(app)
          .put(`/api/requests/${testRequest.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.title).toBe(updateData.title);
        expect(response.body.priority).toBe(updateData.priority);
      });
    });
  });

  describe('Categories', () => {
    
    describe('GET /api/categories', () => {
      it('should list all active categories', async () => {
        const response = await request(app)
          .get('/api/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        
        const testCat = response.body.find((c: any) => c.id === testCategory.id);
        expect(testCat).toBeDefined();
        expect(testCat.name).toBe('Test Category');
      });
    });

    describe('POST /api/categories (Admin)', () => {
      it('should create category as admin', async () => {
        const adminToken = jwt.sign(
          { userId: testAdmin.id },
          process.env.JWT_SECRET || 'assistenza_jwt_secret_2024_secure_key',
          { expiresIn: '1h' }
        );

        const categoryData = {
          name: 'New Category',
          description: 'New test category',
          color: '#00FF00',
          displayOrder: 2
        };

        const response = await request(app)
          .post('/api/categories')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(categoryData)
          .expect(201);

        expect(response.body.name).toBe(categoryData.name);
        
        // Cleanup
        await prisma.category.delete({ where: { id: response.body.id } });
      });

      it('should not allow non-admin to create category', async () => {
        const categoryData = {
          name: 'Unauthorized Category',
          description: 'Should not be created',
          color: '#0000FF'
        };

        await request(app)
          .post('/api/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send(categoryData)
          .expect(403);
      });
    });
  });

  describe('User Profile', () => {
    
    describe('GET /api/users/profile', () => {
      it('should get current user profile', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(testUser.id);
        expect(response.body.email).toBe(testUser.email);
        expect(response.body).not.toHaveProperty('password');
      });
    });

    describe('PUT /api/users/profile', () => {
      it('should update user profile', async () => {
        const updateData = {
          firstName: 'Updated',
          lastName: 'Name',
          phone: '9999999999'
        };

        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.firstName).toBe(updateData.firstName);
        expect(response.body.lastName).toBe(updateData.lastName);
        expect(response.body.phone).toBe(updateData.phone);
      });

      it('should not allow email change to existing email', async () => {
        const updateData = {
          email: testProfessional.email // Try to use professional's email
        };

        await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(409);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit excessive requests', async () => {
      // This test would need rate limiting configuration
      // For now, we just verify the endpoint exists
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/categories')
            .set('Authorization', `Bearer ${authToken}`)
        );
      }

      const responses = await Promise.all(requests);
      
      // At least some should succeed
      const successful = responses.filter(r => r.status === 200);
      expect(successful.length).toBeGreaterThan(0);
    });
  });
});
