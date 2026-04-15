import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    // M-01: Source maps disabled in production — they expose full TypeScript source.
    // Set VITE_SOURCEMAP=true in .env.local during development if needed for debugging.
    sourcemap: process.env.VITE_SOURCEMAP === 'true' ? true : false,
  }
})
