import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // In local dev, the React app runs on :5173 but the Express API is on :5000.
  // This proxy forwards /api/* requests to the backend, matching how Nginx
  // does the same thing in production (see client/nginx.conf).
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});

