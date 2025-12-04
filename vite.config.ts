import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  define: {
    // Allows process.env.API_KEY to be read from Netlify build environment
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    // Polyfill process.env to prevent "process is not defined" error in browser
    'process.env': {},
  },
  build: {
    outDir: 'dist',
  },
});