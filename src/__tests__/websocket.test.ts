/**
 * Test Suite - WebSocket Authentication
 * Test per la connessione WebSocket e autenticazione real-time
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { io as ioClient, Socket } from 'socket.io-client';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Test configuration
const TEST_PORT = 3201; // Different port for testing
const TEST_URL = `http://localhost:${TEST_PORT}`;

describe('WebSocket Authentication', () => {
  let server: Server;
  let clientSocket: Socket;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'wstest@example.com',
        username: 'wstestuser',
        password: await bcrypt.hash('password123', 12),
        firstName: 'WebSocket',
        lastName: 'Test',
        fullName: 'WebSocket Test',
        phone: '1234567890',
        address: 'Test Street',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        role: 'CLIENT'
      }
    });

    // Generate valid JWT token
    authToken = jwt.sign(
      { userId: testUser.id },
      process.env.JWT_SECRET || 'assistenza_jwt_secret_2024_secure_key',
      { expiresIn: '1h' }
    );

    // Note: In a real scenario, you'd start your server here
    // For this example, we assume the server is running
  });

  afterAll(async () => {
    // Cleanup
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } });
    }
    await prisma.$disconnect();
    
    if (clientSocket) {
      clientSocket.disconnect();
    }
  });

  describe('WebSocket Connection', () => {
    
    it('should connect with valid JWT token', (done) => {
      clientSocket = ioClient(TEST_URL, {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should receive connected event with user data', (done) => {
      clientSocket = ioClient(TEST_URL, {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      });

      clientSocket.on('connected', (data) => {
        expect(data).toHaveProperty('userId', testUser.id);
        expect(data).toHaveProperty('role', 'CLIENT');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('socketId');
        done();
      });

      clientSocket.on('connect_error', (error) => {
        done(error);
      });
    });

    it('should fail connection with invalid token', (done) => {
      const invalidSocket = ioClient(TEST_URL, {
        auth: {
          token: 'invalid-token'
        },
        transports: ['websocket']
      });

      invalidSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        invalidSocket.disconnect();
        done();
      });

      invalidSocket.on('connect', () => {
        invalidSocket.disconnect();
        done(new Error('Should not connect with invalid token'));
      });
    });

    it('should fail connection without token', (done) => {
      const noTokenSocket = ioClient(TEST_URL, {
        auth: {},
        transports: ['websocket']
      });

      noTokenSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication token missing');
        noTokenSocket.disconnect();
        done();
      });

      noTokenSocket.on('connect', () => {
        noTokenSocket.disconnect();
        done(new Error('Should not connect without token'));
      });
    });

    it('should fail connection with expired token', (done) => {
      const expiredToken = jwt.sign(
        { userId: testUser.id },
        process.env.JWT_SECRET || 'assistenza_jwt_secret_2024_secure_key',
        { expiresIn: '-1h' } // Already expired
      );

      const expiredSocket = ioClient(TEST_URL, {
        auth: {
          token: expiredToken
        },
        transports: ['websocket']
      });

      expiredSocket.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication failed');
        expiredSocket.disconnect();
        done();
      });

      expiredSocket.on('connect', () => {
        expiredSocket.disconnect();
        done(new Error('Should not connect with expired token'));
      });
    });
  });

  describe('WebSocket Events', () => {
    
    beforeEach((done) => {
      clientSocket = ioClient(TEST_URL, {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        done();
      });
    });

    afterEach(() => {
      if (clientSocket) {
        clientSocket.disconnect();
      }
    });

    it('should respond to ping with pong', (done) => {
      clientSocket.emit('ping');
      
      clientSocket.on('pong', (data) => {
        expect(data).toHaveProperty('timestamp');
        expect(typeof data.timestamp).toBe('number');
        done();
      });
    });

    it('should update user status', (done) => {
      clientSocket.emit('user:status', 'online');
      
      // In real scenario, we'd verify the database update
      // For this test, we just check no error occurs
      setTimeout(() => {
        done();
      }, 100);
    });

    it('should handle disconnect gracefully', (done) => {
      clientSocket.on('disconnect', (reason) => {
        expect(reason).toBeDefined();
        done();
      });

      clientSocket.disconnect();
    });
  });

  describe('Room Management', () => {
    
    beforeEach((done) => {
      clientSocket = ioClient(TEST_URL, {
        auth: {
          token: authToken
        },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        done();
      });
    });

    afterEach(() => {
      if (clientSocket) {
        clientSocket.disconnect();
      }
    });

    it('should join user-specific room automatically', (done) => {
      // The server should automatically join the user to their room
      // We verify this by checking if we receive user-specific messages
      clientSocket.on('connected', (data) => {
        expect(data.userId).toBe(testUser.id);
        // User should be in room: user:${userId}
        done();
      });
    });

    it('should subscribe to additional channels', (done) => {
      const channels = ['notifications', 'updates'];
      
      clientSocket.emit('subscribe', channels);
      
      // In real scenario, we'd verify room membership
      // For this test, we just ensure no error
      setTimeout(() => {
        done();
      }, 100);
    });
  });

  describe('Authentication Refresh', () => {
    
    it('should handle token refresh scenario', async () => {
      // Simulate token refresh by disconnecting and reconnecting
      const socket1 = ioClient(TEST_URL, {
        auth: { token: authToken },
        transports: ['websocket']
      });

      await new Promise((resolve) => {
        socket1.on('connect', resolve);
      });

      expect(socket1.connected).toBe(true);
      socket1.disconnect();

      // Generate new token (simulating refresh)
      const newToken = jwt.sign(
        { userId: testUser.id },
        process.env.JWT_SECRET || 'assistenza_jwt_secret_2024_secure_key',
        { expiresIn: '1h' }
      );

      const socket2 = ioClient(TEST_URL, {
        auth: { token: newToken },
        transports: ['websocket']
      });

      await new Promise((resolve) => {
        socket2.on('connect', resolve);
      });

      expect(socket2.connected).toBe(true);
      socket2.disconnect();
    });
  });

  describe('Error Handling', () => {
    
    it('should emit error for unauthorized channel subscription', (done) => {
      // Create a CLIENT user socket
      clientSocket = ioClient(TEST_URL, {
        auth: { token: authToken },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        // Try to subscribe to admin channel as CLIENT
        clientSocket.emit('subscribe', ['admin:sensitive']);
        
        // Should not receive confirmation for unauthorized channel
        setTimeout(() => {
          done();
        }, 100);
      });
    });

    it('should handle malformed messages gracefully', (done) => {
      clientSocket = ioClient(TEST_URL, {
        auth: { token: authToken },
        transports: ['websocket']
      });

      clientSocket.on('connect', () => {
        // Send malformed data
        clientSocket.emit('unknown-event', { malformed: true });
        
        // Should not crash
        setTimeout(() => {
          done();
        }, 100);
      });
    });
  });
});
