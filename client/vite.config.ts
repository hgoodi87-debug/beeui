import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Optimization for large bundles
    // Temporarily disabled minify due to STATUS_STACK_BUFFER_OVERRUN on Node v24
    minify: false,
    sourcemap: false,
  }
});
