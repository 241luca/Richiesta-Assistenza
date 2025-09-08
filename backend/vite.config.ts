import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/test-setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '*.config.ts',
        'dist/'
      ]
    },
    // Important: Don't run tests in parallel to avoid port conflicts
    threads: false,
    // Use a different port for test server
    pool: 'forks',
    // Actually run the tests, don't skip them
    isolate: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
