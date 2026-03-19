import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const openiconDevHealthPlugin = () => ({
  name: 'openicon-dev-health-endpoint',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (! req.url || req.method !== 'GET') {
        return next();
      }

      if (req.url.startsWith('/_openicon-dev-health')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('x-openicon-dev-server', 'open-icons-acf');
        res.end(JSON.stringify({
          status: 'ok',
          signature: 'openicon:dev:ok',
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

      if (req.url.startsWith('/_openicon-dev-health')) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('x-openicon-dev-server', 'open-icons-acf');
        res.end(JSON.stringify({
          status: 'ok',
          signature: 'openicon:dev:ok',
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
    openiconDevHealthPlugin(),
  ],
  build: {
    outDir: 'assets/build',
    emptyOutDir: true,
    manifest: 'manifest.json',
    assetsDir: '',
    sourcemap: false,
    minify: false,
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
