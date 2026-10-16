import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  // Contexte Netlify ('production', 'deploy-preview', 'branch-deploy') ; 'local' hors Netlify.
  // Sert à n'afficher certains contenus (équipe en préparation) qu'en aperçu.
  define: {
    __CONTEXTE_NETLIFY__: JSON.stringify(process.env.CONTEXT ?? 'local'),
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
