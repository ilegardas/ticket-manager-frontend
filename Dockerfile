FROM node:20-slim

# 1. Instalar pnpm globalmente
RUN npm install -g pnpm

WORKDIR /app

# 2. Copiar todo el repositorio
COPY . .

# 3. Movernos al frontend
WORKDIR /app/frontend

# 4. Instalar dependencias sin bloqueos estrictos
RUN pnpm install --no-frozen-lockfile

# 5. Compilar el proyecto
RUN pnpm run build

# 6. Exponer el puerto
EXPOSE 3000

# 7. Arrancar usando el script nativo que creamos en el package.json
CMD ["pnpm", "run", "preview:railway"]
