import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5175,
    proxy: {
      '/api/v1/members': 'http://localhost:8081',
      '/api/v1/eligibility': 'http://localhost:8082',
      '/api/v1/benefit': 'http://localhost:8082',
      '/api/v1/dro': 'http://localhost:8082',
      '/api/v1/composition': 'http://localhost:8082',
    },
  },
})
