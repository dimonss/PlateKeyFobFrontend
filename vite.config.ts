import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/dev/' : '/keychain/',
  plugins: [react()],
  server: {
    host: true,
    port: 8090,
    allowedHosts: true,
    proxy: {
      '/dev/api': {
        target: 'http://localhost:8095',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dev\/api/, '/api'),
      },
      '/keychain/api': {
        target: 'http://localhost:8095',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/keychain\/api/, '/api'),
      },
      '/api': {
        target: 'http://localhost:8095',
        changeOrigin: true,
      },
    },
  },
}));
