FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Этап сборки server
FROM node:22-alpine AS server-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p ./public
RUN npm run build

# Финальные образы
FROM node:22-alpine AS server
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=server-builder /app/server ./server
COPY --from=server-builder /app/microservices/sender ./microservices/sender
COPY --from=server-builder /app/src ./src
COPY --from=server-builder /app/package.json ./
COPY --from=server-builder /app/tsconfig.json ./
COPY --from=server-builder /app/public ./public
COPY --from=server-builder /app/.next ./.next
EXPOSE 3010
CMD ["npm", "run", "start:server:prod"]

FROM node:22-alpine AS sender
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=server-builder /app/server ./server
COPY --from=server-builder /app/microservices/sender ./microservices/sender
COPY --from=server-builder /app/src ./src
COPY --from=server-builder /app/package.json ./
COPY --from=server-builder /app/tsconfig.json ./
CMD ["npm", "run", "start:sender:prod"]