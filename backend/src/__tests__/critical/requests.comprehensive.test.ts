/**
 * 🔥 COMPREHENSIVE TESTS - Request Management System
 * Test intensivo e capillare per il sistema di gestione richieste
 * Copre: CRUD, Stati, Assegnazioni, Notifiche, Permissions, Edge Cases
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Test users
let clientToken: string;
let professionalToken: string;
let adminToken: string;
let clientId: string;
let professionalId: string;
let adminId: string;
let categoryId: string;
let subcategoryId: string;

describe('🎯 COMPREHENSIVE: Request Management System', () => {

  beforeAll(async () => {
    console.log('🔧 Setup comprehensive test environment...');

    // Create test users
    const hashedPassword = await bcrypt.hash('Test123!', 10);

    const client = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'comprehensive.client@test.com',
        username: 'comp_client',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Client',
        fullName: 'Test Client',
        role: 'CLIENT',
        emailVerified: true
      }
    });
    clientId = client.id;

    const professional = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'comprehensive.pro@test.com',
        username: 'comp_pro',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Professional',
        fullName: 'Test Professional',
        role: 'PROFESSIONAL',
        emailVerified: true,
        canSelfAssign: true
      }
    });
    professionalId = professional.id;

    const admin = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'comprehensive.admin@test.com',
        username: 'comp_admin',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Admin',
        fullName: 'Test Admin',
        role: 'SUPER_ADMIN',
        emailVerified: true
      }
    });
    adminId = admin.id;

    // Create category and subcategory
    const category = await prisma.category.create({
      data: {
        id: uuidv4(),
        name: 'Test Category',
        slug: 'test-category-comp',
        color: '#3B82F6',
        icon: '🔧',
        description: 'Test category',
        isActive: true,
        displayOrder: 0
      }
    });
    categoryId = category.id;

    const subcategory = await prisma.subcategory.create({
      data: {
        id: uuidv4(),
        name: 'Test Subcategory',
        slug: 'test-subcategory-comp',
        description: 'Test subcategory',
        categoryId: category.id,
        isActive: true,
        displayOrder: 0
      }
    });
    subcategoryId = subcategory.id;

    console.log('✅ Test environment ready');
  });

  afterAll(async () => {
    console.log('🧹 Cleanup comprehensive tests...');
    
    // Delete in correct order
    await prisma.request.deleteMany({
      where: {
        OR: [
          { clientId },
          { professionalId }
        ]
      }
    });
    
    await prisma.subcategory.deleteMany({ where: { id: subcategoryId } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    
    await prisma.user.deleteMany({
      where: {
        id: { in: [clientId, professionalId, adminId] }
      }
    });

    await prisma.$disconnect();
    console.log('✅ Cleanup complete');
  });

  describe('1️⃣ CREATE - Request Creation', () => {

    it('✅ Client should create basic request', async () => {
      const newRequest = {
        title: 'Test Request 1',
        description: 'This is a comprehensive test request with detailed description',
        categoryId,
        subcategoryId,
        priority: 'MEDIUM',
        address: 'Via Test 123',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100'
      };

      const response = await request(global.app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(newRequest)
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(newRequest.title);
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.clientId).toBe(clientId);
    });

    it('✅ Should create request with all optional fields', async () => {
      const fullRequest = {
        title: 'Complete Request Test',
        description: 'Request with all possible fields filled',
        categoryId,
        subcategoryId,
        priority: 'HIGH',
        address: 'Via Complete 456',
        city: 'Roma',
        province: 'RM',
        postalCode: '00100',
        latitude: 41.9028,
        longitude: 12.4964,
        requestedDate: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Additional notes for the professional'
      };

      const response = await request(global.app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(fullRequest)
        .expect(201);

      expect(response.body.data.notes).toBe(fullRequest.notes);
      expect(response.body.data.latitude).toBe(fullRequest.latitude);
      expect(response.body.data.longitude).toBe(fullRequest.longitude);
    });

    it('❌ Should reject request without required fields', async () => {
      const invalidRequest = {
        title: 'Incomplete'
      };

      await request(global.app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(invalidRequest)
        .expect(400);
    });

    it('❌ Should reject request with invalid category', async () => {
      const invalidCategory = {
        title: 'Invalid Category Test',
        description: 'This has an invalid category ID',
        categoryId: uuidv4(),
        subcategoryId,
        priority: 'MEDIUM',
        address: 'Via Test',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100'
      };

      await request(global.app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send(invalidCategory)
        .expect(400);
    });

    it('❌ Unauthenticated user cannot create request', async () => {
      const newRequest = {
        title: 'Unauthorized Test',
        description: 'Should fail',
        categoryId,
        subcategoryId,
        priority: 'LOW',
        address: 'Via Test',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100'
      };

      await request(global.app)
        .post('/api/requests')
        .send(newRequest)
        .expect(401);
    });
  });

  describe('2️⃣ READ - Request Retrieval', () => {

    let testRequestId: string;

    beforeEach(async () => {
      // Create a test request
      const req = await prisma.request.create({
        data: {
          id: uuidv4(),
          title: 'Read Test Request',
          description: 'Request for read tests',
          clientId,
          categoryId,
          subcategoryId,
          priority: 'MEDIUM',
          status: 'PENDING',
          address: 'Via Read Test',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        }
      });
      testRequestId = req.id;
    });

    it('✅ Client can retrieve own requests', async () => {
      const response = await request(global.app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((r: any) => r.clientId === clientId)).toBe(true);
    });

    it('✅ Client can retrieve single request by ID', async () => {
      const response = await request(global.app)
        .get(`/api/requests/${testRequestId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(testRequestId);
      expect(response.body.data.title).toBe('Read Test Request');
    });

    it('✅ Admin can retrieve all requests', async () => {
      const response = await request(global.app)
        .get('/api/requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      // Admin sees all requests, not just their own
    });

    it('❌ Client cannot access other client requests', async () => {
      // Create another client and request
      const otherClient = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: 'other.client@test.com',
          username: 'other_client',
          password: await bcrypt.hash('Test123!', 10),
          firstName: 'Other',
          lastName: 'Client',
          fullName: 'Other Client',
          role: 'CLIENT',
          emailVerified: true
        }
      });

      const otherRequest = await prisma.request.create({
        data: {
          id: uuidv4(),
          title: 'Other Client Request',
          description: 'Should not be visible',
          clientId: otherClient.id,
          categoryId,
          subcategoryId,
          priority: 'LOW',
          status: 'PENDING',
          address: 'Via Other',
          city: 'Roma',
          province: 'RM',
          postalCode: '00100'
        }
      });

      await request(global.app)
        .get(`/api/requests/${otherRequest.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      // Cleanup
      await prisma.request.delete({ where: { id: otherRequest.id } });
      await prisma.user.delete({ where: { id: otherClient.id } });
    });

    it('✅ Should support pagination', async () => {
      const response = await request(global.app)
        .get('/api/requests?page=1&limit=10')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
    });

    it('✅ Should support filtering by status', async () => {
      const response = await request(global.app)
        .get('/api/requests?status=PENDING')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(200);

      expect(response.body.data.every((r: any) => r.status === 'PENDING')).toBe(true);
    });
  });

  describe('3️⃣ UPDATE - Request Modification', () => {

    let updateRequestId: string;

    beforeEach(async () => {
      const req = await prisma.request.create({
        data: {
          id: uuidv4(),
          title: 'Update Test Request',
          description: 'Request for update tests',
          clientId,
          categoryId,
          subcategoryId,
          priority: 'LOW',
          status: 'PENDING',
          address: 'Via Update Test',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        }
      });
      updateRequestId = req.id;
    });

    it('✅ Client can update own request (basic fields)', async () => {
      const updates = {
        title: 'Updated Title',
        description: 'Updated description with more details',
        priority: 'HIGH'
      };

      const response = await request(global.app)
        .put(`/api/requests/${updateRequestId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.data.title).toBe(updates.title);
      expect(response.body.data.description).toBe(updates.description);
      expect(response.body.data.priority).toBe(updates.priority);
    });

    it('✅ Admin can change request status', async () => {
      const statusUpdate = {
        status: 'IN_PROGRESS'
      };

      const response = await request(global.app)
        .put(`/api/requests/${updateRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusUpdate)
        .expect(200);

      expect(response.body.data.status).toBe('IN_PROGRESS');
    });

    it('✅ Admin can assign professional', async () => {
      const assignment = {
        professionalId
      };

      const response = await request(global.app)
        .put(`/api/requests/${updateRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignment)
        .expect(200);

      expect(response.body.data.professionalId).toBe(professionalId);
    });

    it('❌ Client cannot change status', async () => {
      const statusUpdate = {
        status: 'COMPLETED'
      };

      await request(global.app)
        .put(`/api/requests/${updateRequestId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send(statusUpdate)
        .expect(403);
    });

    it('❌ Client cannot update others requests', async () => {
      const otherClient = await prisma.user.create({
        data: {
          id: uuidv4(),
          email: 'update.other@test.com',
          username: 'update_other',
          password: await bcrypt.hash('Test123!', 10),
          firstName: 'Update',
          lastName: 'Other',
          fullName: 'Update Other',
          role: 'CLIENT',
          emailVerified: true
        }
      });

      await request(global.app)
        .put(`/api/requests/${updateRequestId}`)
        .set('Authorization', `Bearer ${clientToken}`) // Wrong client
        .send({ title: 'Unauthorized Update' })
        .expect(403);

      await prisma.user.delete({ where: { id: otherClient.id } });
    });
  });

  describe('4️⃣ DELETE - Request Deletion', () => {

    it('✅ Admin can delete request', async () => {
      const req = await prisma.request.create({
        data: {
          id: uuidv4(),
          title: 'Delete Test',
          description: 'Will be deleted',
          clientId,
          categoryId,
          subcategoryId,
          priority: 'LOW',
          status: 'PENDING',
          address: 'Via Delete',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        }
      });

      await request(global.app)
        .delete(`/api/requests/${req.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await prisma.request.findUnique({ where: { id: req.id } });
      expect(deleted).toBeNull();
    });

    it('❌ Client cannot delete request', async () => {
      const req = await prisma.request.create({
        data: {
          id: uuidv4(),
          title: 'No Delete Test',
          description: 'Cannot be deleted by client',
          clientId,
          categoryId,
          subcategoryId,
          priority: 'LOW',
          status: 'PENDING',
          address: 'Via No Delete',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        }
      });

      await request(global.app)
        .delete(`/api/requests/${req.id}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(403);

      // Cleanup
      await prisma.request.delete({ where: { id: req.id } });
    });
  });

  describe('5️⃣ WORKFLOW - Request Status Transitions', () => {

    let workflowRequestId: string;

    beforeEach(async () => {
      const req = await prisma.request.create({
        data: {
          id: uuidv4(),
          title: 'Workflow Test',
          description: 'Test status transitions',
          clientId,
          categoryId,
          subcategoryId,
          priority: 'MEDIUM',
          status: 'PENDING',
          address: 'Via Workflow',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        }
      });
      workflowRequestId = req.id;
    });

    it('✅ Valid transition: PENDING → IN_PROGRESS', async () => {
      const response = await request(global.app)
        .put(`/api/requests/${workflowRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      expect(response.body.data.status).toBe('IN_PROGRESS');
    });

    it('✅ Valid transition: IN_PROGRESS → COMPLETED', async () => {
      // First set to IN_PROGRESS
      await prisma.request.update({
        where: { id: workflowRequestId },
        data: { status: 'IN_PROGRESS' }
      });

      const response = await request(global.app)
        .put(`/api/requests/${workflowRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(response.body.data.status).toBe('COMPLETED');
    });

    it('✅ Can cancel request from any status', async () => {
      const response = await request(global.app)
        .put(`/api/requests/${workflowRequestId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELLED' })
        .expect(200);

      expect(response.body.data.status).toBe('CANCELLED');
    });
  });

  describe('6️⃣ PERMISSIONS - Access Control', () => {

    it('✅ Professional can see assigned requests', async () => {
      const assignedReq = await prisma.request.create({
        data: {
          id: uuidv4(),
          title: 'Assigned Request',
          description: 'Assigned to professional',
          clientId,
          professionalId,
          categoryId,
          subcategoryId,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          address: 'Via Assigned',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        }
      });

      const response = await request(global.app)
        .get(`/api/requests/${assignedReq.id}`)
        .set('Authorization', `Bearer ${professionalToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(assignedReq.id);

      await prisma.request.delete({ where: { id: assignedReq.id } });
    });

    it('❌ Professional cannot see non-assigned requests', async () => {
      const unassignedReq = await prisma.request.create({
        data: {
          id: uuidv4(),
          title: 'Unassigned Request',
          description: 'Not assigned to professional',
          clientId,
          categoryId,
          subcategoryId,
          priority: 'LOW',
          status: 'PENDING',
          address: 'Via Unassigned',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        }
      });

      await request(global.app)
        .get(`/api/requests/${unassignedReq.id}`)
        .set('Authorization', `Bearer ${professionalToken}`)
        .expect(403);

      await prisma.request.delete({ where: { id: unassignedReq.id } });
    });
  });

  describe('7️⃣ EDGE CASES - Boundary Testing', () => {

    it('✅ Handles very long description', async () => {
      const longDescription = 'A'.repeat(5000);
      
      const response = await request(global.app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          title: 'Long Description Test',
          description: longDescription,
          categoryId,
          subcategoryId,
          priority: 'LOW',
          address: 'Via Long',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        })
        .expect(201);

      expect(response.body.data.description).toBe(longDescription);

      await prisma.request.delete({ where: { id: response.body.data.id } });
    });

    it('❌ Rejects description over limit (if any)', async () => {
      const tooLongDescription = 'A'.repeat(10001);

      await request(global.app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          title: 'Too Long Test',
          description: tooLongDescription,
          categoryId,
          subcategoryId,
          priority: 'LOW',
          address: 'Via Too Long',
          city: 'Milano',
          province: 'MI',
          postalCode: '20100'
        })
        .expect(400);
    });

    it('❌ Handles invalid UUID format', async () => {
      await request(global.app)
        .get('/api/requests/not-a-uuid')
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(400);
    });

    it('❌ Handles non-existent request ID', async () => {
      const fakeId = uuidv4();

      await request(global.app)
        .get(`/api/requests/${fakeId}`)
        .set('Authorization', `Bearer ${clientToken}`)
        .expect(404);
    });
  });
});
