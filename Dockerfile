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

# 5. Instalar dependencias reales nativas
RUN pnpm install --no-frozen-lockfile

# 6. Compilar el proyecto de forma directa
RUN pnpm run build

# 7. Exponer el puerto
EXPOSE 3000

# 8. Arrancar usando el script de Vite
CMD ["pnpm", "run", "preview:railway"]
