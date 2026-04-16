import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('/html2canvas/')) return 'vendor-html2canvas';
          if (id.includes('/@tanstack/')) return 'vendor-query';
          if (id.includes('/framer-motion/')) return 'vendor-motion';
          if (id.includes('/lucide-react/')) return 'vendor-icons';
          if (id.includes('/react-dom/')) return 'vendor-react-dom';
          if (id.includes('/@supabase/')) return 'vendor-supabase';
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/supabase': {
        target: process.env.VITE_SUPABASE_URL || 'https://localhost:54321',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase/, '')
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.ts',
    css: true,
  }
});
