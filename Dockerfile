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

# 7. Exponer el puerto predeterminado (Informativo para Docker)
EXPOSE 3000

# 8. ARRANQUE FORZADO: Usamos la ejecución mediante "sh -c" para asegurar 
# que Linux inyecte la variable $PORT dinámica de Railway directamente a Vite
CMD ["sh", "-c", "pnpm vite preview --host 0.0.0.0 --port $PORT"]
