/**
 * Test Setup File
 * Configurazione globale per tutti i test
 */

import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({ 
  path: path.resolve(__dirname, '../../.env.test') 
});

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

// Global test setup
beforeAll(async () => {
  console.log('🧪 Starting test suite...');
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL?.substring(0, 30)}...`);
});

// Global test teardown
afterAll(async () => {
  console.log('✅ Test suite completed');
});

// Mock console methods to reduce noise in tests
if (process.env.QUIET_TESTS === 'true') {
  global.console = {
    ...console,
    log: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    // Keep error for important messages
    error: console.error,
  };
}
