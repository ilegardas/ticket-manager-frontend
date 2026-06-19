import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Number(process.env.PORT) || 3000;
const basePath = process.env.BASE_PATH || "/";

// ⚠️ REEMPLAZA ESTA URL CON TU DOMINIO REAL DEL BACKEND DE RAILWAY
const BACKEND_URL = "https://ticket-manager-production-9d0b.up.railway.app/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    // INTERCEPTOR DINÁMICO CON CONEXIÓN HTTP REAL
    {
      name: 'api-client-live-bridge',
      resolveId(id) {
        if (id === '@workspace/api-client-react') return id;
      },
      load(id) {
        if (id === '@workspace/api-client-react') {
          return `
            import { useQuery, useMutation } from '@tanstack/react-query';

            const BACKEND_URL = "${BACKEND_URL}";

            // Helper centralizado para hacer los fetch con el token de localStorage
            const fetcher = async (endpoint, options = {}) => {
              const token = localStorage.getItem('auth_token');
              const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
                ...options.headers
              };
              const res = await fetch(BACKEND_URL + endpoint, { ...options, headers });
              if (!res.ok) throw new Error('API Error status: ' + res.status);
              return res.json();
            };

            export const setAuthTokenGetter = () => {};
            export const api = {};

            // 1. Mocks de Autenticación Reales con Fetch
            export const useLogin = () => useMutation({
              mutationFn: (data) => fetcher('/api/auth/login', { method: 'POST', body: JSON.stringify(data) })
            });
            export const useLogout = () => useMutation({
              mutationFn: () => fetcher('/api/auth/logout', { method: 'POST' })
            });
            export const useGetMe = () => useQuery({
              queryKey: ['getMe'],
              queryFn: () => fetcher('/api/auth/me').catch(() => null)
            });
            export const getGetMeQueryKey = () => ['getMe'];

            // 2. Interceptor dinámico Proxy para Dashboard, Reportes y cualquier otro Endpoint
            const dummyFn = () => ({ data: null, isLoading: false, mutate: () => {} });
            const proxyHandler = {
              get: (target, prop) => {
                // Si la app pide un QueryKey, regresamos su arreglo identificador
                if (prop.endsWith('QueryKey')) {
                  return () => [prop];
                }
                // Si pide un Hook de consulta (useGetReporte...), mapeamos automáticamente al endpoint
                if (prop.startsWith('useGet')) {
                  const endpoint = '/api/' + prop.replace('useGet', '').toLowerCase();
                  return (options) => useQuery({
                    queryKey: [prop, options],
                    queryFn: () => fetcher(endpoint)
                  });
                }
                // Si pide un Hook de mutación (useCreate, useUpdate...)
                if (prop.startsWith('use')) {
                  const endpoint = '/api/' + prop.replace('use', '').toLowerCase();
                  return () => useMutation({
                    mutationFn: (data) => fetcher(endpoint, { method: 'POST', body: JSON.stringify(data) })
                  });
                }
                return dummyFn;
              }
            };

            const proxy = new Proxy({}, proxyHandler);
            export default proxy;

            // Mantener destructuración feliz para el compilador
            new Proxy({}, { get: () => dummyFn });
          `;
        }
      }
    },
    // Excluir validación estricta de Rollup para el cliente virtual
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
