import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3501,
    proxy: {
      '/api': {
        target: 'http://localhost:3500',
        changeOrigin: true
      }
    }
  }
})
