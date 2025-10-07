import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Global test setup
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.ts',
        '**/*.test.ts',
        '**/index.ts',
      ]
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Setup files
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // Include test files
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // Exclude files
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // Reporter
    reporters: ['verbose'],
    
    // Mock configuration
    mockReset: true,
    restoreMocks: true,
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@prisma/client': path.resolve(__dirname, './node_modules/@prisma/client'),
    },
  },
});
