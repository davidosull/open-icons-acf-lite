import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
  ],
  build: {
    outDir: 'assets/build',
    emptyOutDir: true,
    manifest: '.vite/manifest.json',
    assetsDir: '', // Output assets directly to build dir, not build/assets/
    rollupOptions: {
      input: {
        picker: resolve(__dirname, 'src/picker.tsx'),
        settings: resolve(__dirname, 'src/settings.tsx'),
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
