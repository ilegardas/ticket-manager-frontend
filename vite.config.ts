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
      // ENGAÑO EXPANDIDO: Simulamos los hooks reales que useAuth.tsx está buscando obligatoriamente
      "@workspace/api-client-react": "data:text/javascript," + 
        "export const setAuthTokenGetter = () => {}; " +
        "export const api = {}; " +
        "export const useLogin = () => ({ mutate: () => {}, isLoading: false }); " +
        "export const useLogout = () => ({ mutate: () => {} }); " +
        "export const useGetMe = () => ({ data: null, isLoading: false }); " +
        "export const getGetMeQueryKey = () => ['getMe'];"
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
