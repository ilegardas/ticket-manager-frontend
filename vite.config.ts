import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Number(process.env.PORT) || 3000;
const basePath = process.env.BASE_PATH || "/";

// Plugin dinámico para inyectar el API Client Mock sin que Rollup valide exportaciones fijas
const apiMockPlugin = () => {
  const virtualModuleId = '@workspace/api-client-react';
  return {
    name: 'api-client-mock',
    resolveId(id: string) {
      if (id === virtualModuleId) return id;
    },
    load(id: string) {
      if (id === virtualModuleId) {
        return `
          export const setAuthTokenGetter = () => {};
          export const api = {};
          const dummyFn = () => ({ data: null, isLoading: false, mutate: () => {} });
          const handler = { get: () => dummyFn };
          const proxy = new Proxy({}, handler);
          export default proxy;
          // Proxy en tiempo de evaluación para interceptar cualquier destructuración
          new Proxy({}, {
            get: (target, prop) => { return dummyFn; }
          });
        `;
      }
    }
  };
};

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // Forzamos a Vite/Rollup a externalizar de forma segura el módulo en producción
    {
      name: 'externalize-api',
      options(options) {
        if (!options.external) options.external = [];
        if (Array.isArray(options.external)) {
          options.external.push('@workspace/api-client-react');
        }
      }
    }
  ],
  assetsInclude: ['**/*.node'],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "src/assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      external: [
        '**/*.node',
        /@tailwindcss\/oxide/,
        'fsevents'
      ]
    }
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
