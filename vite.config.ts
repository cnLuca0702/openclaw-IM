import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/openclaw-api': {
        target: 'http://180.76.133.26:18789',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openclaw-api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist/react',
    emptyOutDir: true,
  },
});
