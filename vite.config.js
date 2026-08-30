import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        changeOrigin: true,
        target: process.env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000',
      },
    },
  },
  test: {
    environment: 'jsdom',
    // The interaction-heavy workspace tests share mocked browser state. Running
    // files serially prevents worker contention and keeps CI results repeatable.
    fileParallelism: false,
    setupFiles: './src/test/setup.js',
    testTimeout: 10000,
  },
})
