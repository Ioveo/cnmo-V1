import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      // Proxy API requests to the Worker during local development
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      }
    }
  }
});