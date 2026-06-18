FROM node:20-slim

# Instalar pnpm globalmente
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos desde la subcarpeta frontend
COPY frontend/package.json ./frontend/
WORKDIR /app/frontend

RUN pnpm install --no-frozen-lockfile

# Copiar el resto del código v
WORKDIR /app
COPY . .

WORKDIR /app/frontend
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "exec", "vite", "preview", "--host", "0.0.0.0", "--port", "3000"]
