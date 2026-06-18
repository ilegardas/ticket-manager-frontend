FROM node:20-slim

# 1. Instalar pnpm de forma global
RUN npm install -g pnpm

WORKDIR /app

# 2. Copiar absolutamente todo el repositorio
COPY . .

# 3. Movernos directamente a la subcarpeta del frontend
WORKDIR /app/frontend

# 4. Instalar las dependencias ignorando bloqueos estrictos
RUN pnpm install --no-frozen-lockfile

# 5. Compilar la aplicación con Vite
RUN pnpm run build

# 6. Exponer el puerto de producción
EXPOSE 3000

# 7. Arrancar el servidor llamando al binario directo de Vite sin intermediarios
CMD ["./node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
