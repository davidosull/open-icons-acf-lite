import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const acfoiDevHealthPlugin = () => ({
  name: 'acfoi-dev-health-endpoint',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (! req.url || req.method !== 'GET') {
        return next();
      }

      if (req.url.startsWith('/_acfoi-dev-health')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-ACFOI-Dev-Server', 'acf-open-icons');
        res.end(JSON.stringify({
          status: 'ok',
          signature: 'acfoi:dev:ok',
        }));
        return;
      }

      return next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      if (! req.url || req.method !== 'GET') {
        return next();
      }

      if (req.url.startsWith('/_acfoi-dev-health')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-ACFOI-Dev-Server', 'acf-open-icons');
        res.end(JSON.stringify({
          status: 'ok',
          signature: 'acfoi:dev:ok',
        }));
        return;
      }

      return next();
    });
  },
});

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    acfoiDevHealthPlugin(),
  ],
  build: {
    outDir: 'assets/build',
    emptyOutDir: true,
    manifest: '.vite/manifest.json',
    assetsDir: '',
    sourcemap: false,
    minify: 'esbuild',
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
