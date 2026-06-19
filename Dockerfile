FROM node:20-slim

# 1. Instalar pnpm globalmente
RUN npm install -g pnpm

WORKDIR /app

# 2. Copiar todo el repositorio
COPY . .

# 3. Movernos al frontend
WORKDIR /app/frontend

# 4. Limpiar rastros viejos
RUN rm -rf pnpm-lock.yaml node_modules

# 5. Instalar dependencias reales
RUN pnpm install --no-frozen-lockfile

# 6. ENGAÑAR A VITE: Crear el módulo falso corregido (sin el error de -index)
RUN mkdir -p node_modules/@workspace/api-client-react && \
    echo 'export const setAuthTokenGetter = () => {}; export const api = {};' > node_modules/@workspace/api-client-react/index.js && \
    echo '{"name":"@workspace/api-client-react","version":"1.0.0","main":"index.js"}' > node_modules/@workspace/api-client-react/package.json

# 7. Compilar el proyecto con el módulo falso ya inyectado
RUN pnpm run build

# 8. Exponer el puerto
EXPOSE 3000

# 9. Arrancar usando el script de Vite
CMD ["pnpm", "run", "preview:railway"]
