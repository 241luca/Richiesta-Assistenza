/**
 * Integration Test Suite - Complete User Journey
 * Test del percorso completo utente dal login alla creazione preventivo
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

describe('Complete User Journey', () => {
  let clientToken: string;
  let professionalToken: string;
  let adminToken: string;
  
  let testClient: any;
  let testprofessional: any;
  let testAdmin: any;
  let testcategory: any;
  let testsubcategories: any;
  let testRequest: any;
  let testQuote: any;

  beforeAll(async () => {
    // Clean up existing test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['journey.client@test.com', 'journey.pro@test.com', 'journey.admin@test.com']
        }
      }
    });

    // Create test users
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    
    testClient = await prisma.user.create({
      data: {
        email: 'journey.client@test.com',
        username: 'journeyclient',
        password: hashedPassword,
        firstName: 'Journey',
        lastName: 'Client',
        fullName: 'Journey Client',
        phone: '1111111111',
        address: 'Via Cliente 1',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        role: 'CLIENT'
      }
    });

    testProfessional = await prisma.user.create({
      data: {
        email: 'journey.pro@test.com',
        username: 'journeypro',
        password: hashedPassword,
        firstName: 'Journey',
        lastName: 'Professional',
        fullName: 'Journey Professional',
        phone: '2222222222',
        address: 'Via Pro 2',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        role: 'PROFESSIONAL'
      }
    });

    testAdmin = await prisma.user.create({
      data: {
        email: 'journey.admin@test.com',
        username: 'journeyadmin',
        password: hashedPassword,
        firstName: 'Journey',
        lastName: 'Admin',
        fullName: 'Journey Admin',
        phone: '3333333333',
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
        name: 'Journey Test Category',
        slug: 'journey-test-category',
        description: 'Category for journey testing',
        color: '#123456',
        isActive: true,
        displayOrder: 99
      }
    });

    // Create test subcategory
    testSubcategory = await prisma.subcategory.create({
      data: {
        name: 'Journey Test Subcategory',
        description: 'Subcategory for journey testing',
        categoryId: testCategory.id,
        isActive: true,
        displayOrder: 1
      }
    });

    // Generate tokens
    clientToken = jwt.sign(
      { userId: testClient.id },
      process.env.JWT_SECRET || 'assistenza_jwt_secret_2024_secure_key',
      { expiresIn: '1h' }
    );

    professionalToken = jwt.sign(
      { userId: testProfessional.id },
      process.env.JWT_SECRET || 'assistenza_jwt_secret_2024_secure_key',
      { expiresIn: '1h' }
    );

    adminToken = jwt.sign(
      { userId: testAdmin.id },
      process.env.JWT_SECRET || 'assistenza_jwt_secret_2024_secure_key',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up in reverse order
    if (testQuote) {
      await prisma.quote.delete({ where: { id: testQuote.id } }).catch(() => {});
    }
    if (testRequest) {
      await prisma.assistanceRequest.delete({ where: { id: testRequest.id } }).catch(() => {});
    }
    if (testSubcategory) {
      await prisma.subcategory.delete({ where: { id: testSubcategory.id } }).catch(() => {});
    }
    if (testCategory) {
      await prisma.category.delete({ where: { id: testCategory.id } }).catch(() => {});
    }
    
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['journey.client@test.com', 'journey.pro@test.com', 'journey.admin@test.com']
        }
      }
    });
    
    await prisma.$disconnect();
  });

  describe('Step 1: Client Login', () => {
    it('should login client successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'journey.client@test.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.role).toBe('CLIENT');
    });
  });

  describe('Step 2: Client Creates Request', () => {
    it('should create assistance request', async () => {
      const requestData = {
        title: 'Journey Test Request',
        description: 'This is a complete journey test request',
        categoryId: testCategory.id,
        subcategoryId: testSubcategory.id,
        priority: 'HIGH',
        address: 'Via Test Journey 123',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        requestedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };

      const response = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(requestData.title);
      expect(response.body.status).toBe('PENDING');
      expect(response.body.clientId).toBe(testClient.id);

      testRequest = response.body;
    });

    it('should list client requests', async () => {
      const response = await request(app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const createdRequest = response.body.find((r: any) => r.id === testRequest.id);
      expect(createdRequest).toBeDefined();
    });
  });

  describe('Step 3: Admin Assigns Professional', () => {
    it('should allow admin to view all requests', async () => {
      const response = await request(app)
        .get('/api/admin/requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const pendingRequest = response.body.find((r: any) => r.id === testRequest.id);
      expect(pendingRequest).toBeDefined();
    });

    it('should assign professional to request', async () => {
      const response = await request(app)
        .put(`/api/admin/requests/${testRequest.id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          professionalId: testProfessional.id
        })
        .expect(200);

      expect(response.body.professionalId).toBe(testProfessional.id);
      expect(response.body.status).toBe('ASSIGNED');
    });
  });

  describe('Step 4: Professional Creates Quote', () => {
    it('should allow professional to view assigned request', async () => {
      const response = await request(app)
        .get(`/api/requests/${testRequest.id}`)
        .set('Authorization', `Bearer ${professionalToken}`)
        .expect(200);

      expect(response.body.id).toBe(testRequest.id);
      expect(response.body.professionalId).toBe(testProfessional.id);
    });

    it('should create quote for request', async () => {
      const quoteData = {
        requestId: testRequest.id,
        title: 'Preventivo Journey Test',
        description: 'Preventivo completo per il test journey',
        items: [
          {
            description: 'Manodopera',
            quantity: 2,
            unitPrice: 5000, // 50.00€ in cents
            taxRate: 0.22
          },
          {
            description: 'Materiali',
            quantity: 1,
            unitPrice: 10000, // 100.00€ in cents
            taxRate: 0.22
          }
        ],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 30 days
        notes: 'Preventivo di test per journey completo'
      };

      const response = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${professionalToken}`)
        .send(quoteData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.requestId).toBe(testRequest.id);
      expect(response.body.professionalId).toBe(testProfessional.id);
      expect(response.body.status).toBe('DRAFT');
      expect(response.body.items).toHaveLength(2);

      testQuote = response.body;
    });

    it('should update quote status to pending', async () => {
      const response = await request(app)
        .put(`/api/quotes/${testQuote.id}/status`)
        .set('Authorization', `Bearer ${professionalToken}`)
        .send({
          status: 'PENDING'
        })
        .expect(200);

      expect(response.body.status).toBe('PENDING');
    });
  });

  describe('Step 5: Client Reviews Quote', () => {
    it('should allow client to view quotes for request', async () => {
      const response = await request(app)
        .get(`/api/requests/${testRequest.id}/quotes`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(testQuote.id);
    });

    it('should not show draft quotes to client', async () => {
      // Create a draft quote
      const draftQuote = await prisma.quote.create({
        data: {
          requestId: testRequest.id,
          professionalId: testProfessional.id,
          title: 'Draft Quote',
          amount: 5000,
          status: 'DRAFT'
        }
      });

      const response = await request(app)
        .get(`/api/requests/${testRequest.id}/quotes`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      // Should not include draft quote
      const foundDraft = response.body.find((q: any) => q.id === draftQuote.id);
      expect(foundDraft).toBeUndefined();

      // Clean up
      await prisma.quote.delete({ where: { id: draftQuote.id } });
    });

    it('should allow client to accept quote', async () => {
      const response = await request(app)
        .post(`/api/quotes/${testQuote.id}/accept`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.status).toBe('ACCEPTED');
      expect(response.body.message).toContain('accettato');
    });
  });

  describe('Step 6: Request Completion', () => {
    it('should update request status to in progress', async () => {
      const response = await request(app)
        .put(`/api/requests/${testRequest.id}/status`)
        .set('Authorization', `Bearer ${professionalToken}`)
        .send({
          status: 'IN_PROGRESS'
        })
        .expect(200);

      expect(response.body.status).toBe('IN_PROGRESS');
    });

    it('should complete request', async () => {
      const response = await request(app)
        .put(`/api/requests/${testRequest.id}/status`)
        .set('Authorization', `Bearer ${professionalToken}`)
        .send({
          status: 'COMPLETED',
          completionNotes: 'Lavoro completato con successo'
        })
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');
    });
  });

  describe('Step 7: Notifications', () => {
    it('should have notifications for client', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Client should have notifications about request updates
    });

    it('should have notifications for professional', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${professionalToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Professional should have notifications about assignments
    });
  });

  describe('Step 8: Data Validation', () => {
    it('should have complete audit trail', async () => {
      // Verify request has all expected fields
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: testRequest.id },
        include: {
          client: true,
          professional: true,
          quotes: true
        }
      });

      expect(request).toBeDefined();
      expect(request?.client.id).toBe(testClient.id);
      expect(request?.professional?.id).toBe(testProfessional.id);
      expect(request?.status).toBe('COMPLETED');
      expect(request?.quotes).toHaveLength(1);
    });

    it('should have correct quote status', async () => {
      const quote = await prisma.quote.findUnique({
        where: { id: testQuote.id },
        include: {
          items: true
        }
      });

      expect(quote).toBeDefined();
      expect(quote?.status).toBe('ACCEPTED');
      expect(quote?.items).toHaveLength(2);
    });
  });

  describe('Step 9: Security Checks', () => {
    it('should not allow client to modify other users requests', async () => {
      // Create another client
      const otherClient = await prisma.user.create({
        data: {
          email: 'other.client@test.com',
          username: 'otherclient',
          password: await bcrypt.hash('password', 12),
          firstName: 'Other',
          lastName: 'Client',
          fullName: 'Other Client',
          phone: '9999999999',
          address: 'Via Other',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100',
          role: 'CLIENT'
        }
      });

      const otherToken = jwt.sign(
        { userId: otherClient.id },
        process.env.JWT_SECRET || 'assistenza_jwt_secret_2024_secure_key',
        { expiresIn: '1h' }
      );

      // Try to modify original client's request
      await request(app)
        .put(`/api/requests/${testRequest.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Hacked Title'
        })
        .expect(403);

      // Clean up
      await prisma.user.delete({ where: { id: otherClient.id } });
    });

    it('should not allow professional to create quote for unassigned request', async () => {
      // Create unassigned request
      const unassignedRequest = await prisma.assistanceRequest.create({
        data: {
          title: 'Unassigned Request',
          description: 'Test',
          clientId: testClient.id,
          categoryId: testCategory.id,
          status: 'PENDING',
          priority: 'LOW',
          address: 'Test',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        }
      });

      // Try to create quote
      await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${professionalToken}`)
        .send({
          requestId: unassignedRequest.id,
          title: 'Unauthorized Quote',
          items: []
        })
        .expect(403);

      // Clean up
      await prisma.assistanceRequest.delete({ where: { id: unassignedRequest.id } });
    });
  });
});
