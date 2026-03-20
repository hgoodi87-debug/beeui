import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('/firebase/')) {
            return 'vendor-firebase';
          }

          if (id.includes('/@tanstack/')) {
            return 'vendor-query';
          }
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  // @ts-ignore - Vitest types might be missing in some environments
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.ts',
    css: true,
  }
});
