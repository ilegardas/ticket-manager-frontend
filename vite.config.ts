import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Number(process.env.PORT) || 3000;
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss()
  ],
  assetsInclude: ['**/*.node'],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "src/assets"),
      // MOCK DE PROXY GLOBAL: Responde automáticamente a cualquier hook o queryKey de Replit que la app pida
      "@workspace/api-client-react": "data:text/javascript," + 
        "export const setAuthTokenGetter = () => {}; " +
        "export const api = {}; " +
        "const dummyFn = () => ({ data: null, isLoading: false, mutate: () => {} }); " +
        "const proxy = new Proxy({}, { get: () => dummyFn }); " +
        "export default proxy; " +
        "export const { " +
        "  useLogin, useLogout, useGetMe, getGetMeQueryKey, " +
        "  useGetReporteResumen, useGetActividadReciente, useGetReportePorEstado, " +
        "  useGetReportePorSistema, useGetReporteTendencias, getGetReporteResumenQueryKey, " +
        "  getGetActividadRecienteQueryKey, useGetTickets, useCreateTicket, useUpdateTicketStatus " +
        "} = proxy;"
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
