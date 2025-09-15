import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Custom plugin to disable service workers gently
const disableServiceWorker = () => {
  return {
    name: 'disable-service-worker',
    configureServer(server: any) {
      // Disable service worker middleware gently
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url?.includes('service-worker') || req.url?.includes('sw.js')) {
          res.statusCode = 404;
          res.end('Service Worker Disabled');
          return;
        }
        next();
      });
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Disable caching headers
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  },
  // Disable build caching
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    // Disable source maps to prevent caching
    sourcemap: false
  },
  // Disable HMR caching
  optimizeDeps: {
    force: true
  },
  // Disable all caching
  cacheDir: '.vite-cache-disabled',
  plugins: [
    disableServiceWorker(),
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
}));
