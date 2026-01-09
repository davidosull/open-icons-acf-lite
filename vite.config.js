import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const acfoilDevHealthPlugin = () => ({
  name: 'acfoil-dev-health-endpoint',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (! req.url || req.method !== 'GET') {
        return next();
      }

      if (req.url.startsWith('/_acfoil-dev-health')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-ACFOIL-Dev-Server', 'acf-open-icons-lite');
        res.end(JSON.stringify({
          status: 'ok',
          signature: 'acfoil:dev:ok',
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

      if (req.url.startsWith('/_acfoil-dev-health')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-ACFOIL-Dev-Server', 'acf-open-icons-lite');
        res.end(JSON.stringify({
          status: 'ok',
          signature: 'acfoil:dev:ok',
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
    acfoilDevHealthPlugin(),
  ],
  build: {
    outDir: 'assets/build',
    emptyOutDir: true,
    manifest: 'manifest.json',
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
    port: 5174,
    strictPort: true,
  },
});
