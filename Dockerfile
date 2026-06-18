FROM node:20-slim

# 1. Instalar pnpm globalmente
RUN npm install -g pnpm

WORKDIR /app

# 2. Copiar todo el repositorio
COPY . .

# 3. Movernos al frontend
WORKDIR /app/frontend

# 4. LIMPIEZA RADICAL: Borrar cualquier rastro de lockfiles corruptos antes de instalar
RUN rm -rf pnpm-lock.yaml node_modules

# 5. Instalar dependencias desde cero de forma limpia
RUN pnpm install --no-frozen-lockfile

# 6. Compilar el proyecto
RUN pnpm run build

# 7. Exponer el puerto
EXPOSE 3000

# 8. Arrancar usando el script nativo del package.json
CMD ["pnpm", "run", "preview:railway"]
